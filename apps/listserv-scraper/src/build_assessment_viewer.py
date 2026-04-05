"""
Build an interactive HTML viewer for assessing classifier quality.

Combines: UMAP coordinates + binary classification + tags + features + org info
Supports: filtering by event/not-event, tags, orgs, categories, search
"""

import json
import html
import re
import numpy as np
from pathlib import Path
from collections import Counter

DATA_DIR = Path(__file__).resolve().parent.parent / "data"


def load_all():
    """Load and merge all datasets."""
    # Core data
    with open(DATA_DIR / "whitmanwire_emails.json") as f:
        msgs = json.load(f)["messages"]
    msg_map = {m["message_id"]: m for m in msgs}

    # UMAP coordinates (40k)
    umap_2d = np.load(DATA_DIR / "whitmanwire_umap2d.npy")
    hdbscan_labels = np.load(DATA_DIR / "whitmanwire_hdbscan_labels.npy")

    # LLM outputs (500 each)
    classify = {}
    if (DATA_DIR / "llm_classify_results.json").exists():
        with open(DATA_DIR / "llm_classify_results.json") as f:
            for r in json.load(f):
                classify[r["message_id"]] = r

    tagged = {}
    if (DATA_DIR / "llm_tagged_results.json").exists():
        with open(DATA_DIR / "llm_tagged_results.json") as f:
            for r in json.load(f):
                tagged[r["message_id"]] = r

    features = {}
    if (DATA_DIR / "llm_features.json").exists():
        with open(DATA_DIR / "llm_features.json") as f:
            for r in json.load(f):
                features[r["message_id"]] = r

    taxonomy = []
    if (DATA_DIR / "llm_taxonomy.json").exists():
        with open(DATA_DIR / "llm_taxonomy.json") as f:
            taxonomy = json.load(f)

    return msgs, umap_2d, hdbscan_labels, classify, tagged, features, taxonomy


def build_org_categories(msgs):
    """Infer org categories from author names."""
    author_counts = Counter(m["author_name"] for m in msgs)

    # Manual category mapping for top orgs
    tech_keywords = ["tech", "code", "hack", "data", "computer", "software", "ai", "hoagie", "tigerapps", "quant", "blockchain", "crypto"]
    dance_keywords = ["dance", "ballet", "bhangra", "naacho", "raqs", "hip hop", "choreograph"]
    music_keywords = ["music", "choir", "glee", "a cappella", "acapella", "orchestra", "band", "pianists", "jazz"]
    theater_keywords = ["theatre", "theater", "intime", "triangle", "improv", "comedy", "acting", "drama"]
    food_keywords = ["food", "coffee", "baking", "challah", "culinary", "dining", "cheese"]
    sports_keywords = ["sport", "athletic", "rugby", "fencing", "climbing", "soccer", "basketball", "tennis", "swim", "run", "track", "ultimate"]
    political_keywords = ["democrat", "republican", "political", "whig", "clio", "government", "policy", "progressive"]
    cultural_keywords = ["asian", "black", "latino", "latina", "hispanic", "chinese", "korean", "japanese", "indian", "african", "caribbean", "jewish", "muslim", "christian", "hindu", "sikh", "persian", "arab", "vietnamese", "filipino", "pakistani"]
    service_keywords = ["service", "volunteer", "community", "civic", "habitat", "tutor"]
    media_keywords = ["daily", "prince", "nassau", "magazine", "journal", "publication", "radio", "film", "photo"]

    def categorize_author(name):
        n = name.lower()
        cats = []
        if any(k in n for k in tech_keywords): cats.append("tech")
        if any(k in n for k in dance_keywords): cats.append("dance")
        if any(k in n for k in music_keywords): cats.append("music")
        if any(k in n for k in theater_keywords): cats.append("theater")
        if any(k in n for k in food_keywords): cats.append("food")
        if any(k in n for k in sports_keywords): cats.append("sports")
        if any(k in n for k in political_keywords): cats.append("political")
        if any(k in n for k in cultural_keywords): cats.append("cultural")
        if any(k in n for k in service_keywords): cats.append("service")
        if any(k in n for k in media_keywords): cats.append("media")
        return cats if cats else ["other"]

    org_cats = {}
    for name in author_counts:
        org_cats[name] = categorize_author(name)

    return org_cats


def main():
    print("Loading all data...", flush=True)
    msgs, umap_2d, hdbscan_labels, classify, tagged, features, taxonomy = load_all()

    print("Building org categories...", flush=True)
    org_cats = build_org_categories(msgs)

    # Get all unique tags and orgs for filters
    all_tags = set()
    for r in tagged.values():
        for t in r.get("tags", []):
            tag = t["tag"] if isinstance(t, dict) else t
            all_tags.add(tag)
    all_tags = sorted(all_tags)

    all_orgs = Counter(m["author_name"] for m in msgs)
    top_orgs = [name for name, _ in all_orgs.most_common(100)]

    all_org_cat_set = set()
    for cats in org_cats.values():
        all_org_cat_set.update(cats)
    all_org_cat_set = sorted(all_org_cat_set)

    print(f"Building HTML ({len(msgs)} points)...", flush=True)

    # Build point data
    points = []
    for i, m in enumerate(msgs):
        mid = m["message_id"]
        cl = classify.get(mid, {})
        tg = tagged.get(mid, {})
        ft = features.get(mid, {})

        tag_list = []
        for t in tg.get("tags", []):
            tag_list.append(t["tag"] if isinstance(t, dict) else t)

        body_preview = html.escape(m.get("body_text", "")[:250].replace("\n", " "))
        subj = html.escape(m.get("subject", "")[:120])
        author = html.escape(m.get("author_name", ""))
        sender = html.escape(m.get("hoagiemail_sender_name", "") or "")
        url = m.get("listserv_url", "")
        org_category = org_cats.get(m.get("author_name", ""), ["other"])

        points.append({
            "x": round(float(umap_2d[i, 0]), 3),
            "y": round(float(umap_2d[i, 1]), 3),
            "s": subj,
            "a": author,
            "d": m.get("date", "")[:10],
            "b": body_preview,
            "u": url,
            "h": int(hdbscan_labels[i]),
            "ev": cl.get("is_event"),
            "ec": cl.get("confidence", 0),
            "er": html.escape(cl.get("reason", "")[:100]),
            "t": tag_list,
            "cat": ft.get("category", ""),
            "urg": ft.get("urgency", ""),
            "food": ft.get("has_food", False),
            "oc": org_category,
            "hm": m.get("is_hoagiemail", False),
            "sn": sender,
        })

    points_json = json.dumps(points)
    tags_json = json.dumps(all_tags)
    orgs_json = json.dumps(top_orgs[:80])
    org_cats_json = json.dumps(all_org_cat_set)
    taxonomy_json = json.dumps(taxonomy)

    html_content = f"""<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>WHITMANWIRE — Classifier Assessment Viewer</title>
<style>
* {{ margin:0; padding:0; box-sizing:border-box; }}
body {{ font-family: -apple-system, BlinkMacSystemFont, sans-serif; background:#0f0f1a; color:#eee; overflow:hidden; }}
#app {{ display:flex; height:100vh; }}
#left {{ flex:1; display:flex; flex-direction:column; }}
#toolbar {{ padding:8px 12px; background:#1a1a2e; display:flex; gap:8px; flex-wrap:wrap; align-items:center; border-bottom:1px solid #333; }}
#toolbar label {{ font-size:11px; color:#888; }}
#toolbar select, #toolbar input {{ padding:4px 8px; background:#222; color:#eee; border:1px solid #444; border-radius:3px; font-size:11px; }}
#toolbar button {{ padding:4px 10px; background:#333; color:#ccc; border:1px solid #555; border-radius:3px; font-size:11px; cursor:pointer; }}
#toolbar button:hover {{ background:#ff6b35; color:#fff; border-color:#ff6b35; }}
#toolbar button.active {{ background:#ff6b35; color:#fff; border-color:#ff6b35; }}
#toolbar .sep {{ width:1px; height:20px; background:#444; margin:0 4px; }}
#canvas-wrap {{ flex:1; position:relative; }}
canvas {{ display:block; cursor:crosshair; }}
#tooltip {{ position:absolute; background:rgba(22,33,62,0.95); border:1px solid #ff6b35; border-radius:6px; padding:10px; font-size:11px; pointer-events:none; display:none; max-width:400px; z-index:10; }}
#tooltip .ts {{ font-weight:600; color:#fff; margin-bottom:3px; }}
#tooltip .tm {{ color:#888; font-size:10px; }}
#sidebar {{ width:400px; background:#16213e; overflow-y:auto; border-left:1px solid #333; }}
#sidebar-header {{ padding:10px 14px; background:#1a1a2e; border-bottom:1px solid #333; font-size:12px; color:#888; }}
#cards {{ padding:10px; }}
.card {{ background:#1a1a2e; border-radius:6px; padding:12px; margin-bottom:8px; border:1px solid #333; font-size:12px; }}
.card:hover {{ border-color:#ff6b35; }}
.card .subj {{ font-weight:600; color:#fff; margin-bottom:3px; }}
.card .meta {{ color:#888; font-size:10px; margin-bottom:5px; }}
.card .body {{ color:#aaa; font-size:11px; line-height:1.5; margin-bottom:5px; }}
.card .tags {{ display:flex; flex-wrap:wrap; gap:3px; margin-bottom:4px; }}
.card .tag {{ padding:2px 6px; border-radius:3px; font-size:9px; font-weight:600; }}
.tag-event {{ background:#2d5a2d; color:#6aff6a; }}
.tag-not-event {{ background:#5a2d2d; color:#ff6a6a; }}
.tag-unknown {{ background:#3a3a3a; color:#aaa; }}
.tag-cat {{ background:#2d3a5a; color:#6ab0ff; }}
.card a {{ color:#ff6b35; text-decoration:none; font-size:10px; }}
.card a:hover {{ text-decoration:underline; }}
#stats {{ position:absolute; bottom:8px; left:8px; font-size:10px; color:#555; z-index:5; }}
</style>
</head>
<body>
<div id="app">
<div id="left">
<div id="toolbar">
    <label>Color:</label>
    <select id="color-mode" onchange="draw()">
        <option value="classify">Event/Not-Event</option>
        <option value="cluster">HDBSCAN Cluster</option>
        <option value="tag">Primary Tag</option>
        <option value="org-cat">Org Category</option>
        <option value="urgency">Urgency</option>
        <option value="year">Year</option>
        <option value="food">Has Food</option>
    </select>
    <div class="sep"></div>
    <label>Filter:</label>
    <select id="filter-event" onchange="draw()">
        <option value="all">All</option>
        <option value="event">Events only</option>
        <option value="not-event">Not-events only</option>
        <option value="unlabeled">Unlabeled</option>
    </select>
    <select id="filter-tag" onchange="draw()">
        <option value="all">All tags</option>
    </select>
    <select id="filter-org-cat" onchange="draw()">
        <option value="all">All org types</option>
    </select>
    <div class="sep"></div>
    <input type="text" id="search" placeholder="Search subjects..." oninput="draw()" style="width:180px;">
    <div class="sep"></div>
    <button onclick="resetView()">Reset</button>
    <span id="count" style="font-size:10px;color:#888;margin-left:8px;"></span>
</div>
<div id="canvas-wrap">
    <canvas id="c"></canvas>
    <div id="tooltip"><div class="ts"></div><div class="tm"></div></div>
    <div id="stats"></div>
</div>
</div>
<div id="sidebar">
    <div id="sidebar-header">Click or drag to select emails</div>
    <div id="cards"></div>
</div>
</div>
<script>
const data={points_json};
const allTags={tags_json};
const allOrgCats={org_cats_json};
const taxonomy={taxonomy_json};

// Populate filter dropdowns
const tagSel=document.getElementById('filter-tag');
allTags.forEach(t=>{{const o=document.createElement('option');o.value=t;o.textContent=t;tagSel.appendChild(o);}});
const ocSel=document.getElementById('filter-org-cat');
allOrgCats.forEach(c=>{{const o=document.createElement('option');o.value=c;o.textContent=c;ocSel.appendChild(o);}});

const canvas=document.getElementById('c');
const ctx=canvas.getContext('2d');
const tip=document.getElementById('tooltip');
const cards=document.getElementById('cards');
const countEl=document.getElementById('count');

let W,H,scale=1,ox=0,oy=0;
let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity;
for(const p of data){{if(p.x<minX)minX=p.x;if(p.x>maxX)maxX=p.x;if(p.y<minY)minY=p.y;if(p.y>maxY)maxY=p.y;}}
const rX=maxX-minX,rY=maxY-minY,pad=0.05;

// Color schemes
const clusterColors={{}};
for(let i=-1;i<150;i++){{if(i===-1){{clusterColors[i]='rgba(60,60,60,0.12)';continue;}}const h=(i*17.3)%360;clusterColors[i]=`hsla(${{h}},65%,55%,0.65)`;}}
const tagColors={{'academic-events':'#3498db','career-professional':'#f39c12','performing-arts':'#9b59b6','social-gatherings':'#e74c3c','student-organizations':'#2ecc71','cultural-events':'#e91e63','guest-speakers':'#00bcd4','wellness-support':'#8bc34a','community-service':'#ff9800','arts-crafts':'#cddc39','film-screenings':'#795548','food-events':'#ff5722','activism-advocacy':'#607d8b','study-breaks':'#4caf50','general-updates':'#9e9e9e'}};
const orgCatColors={{'tech':'#00bcd4','dance':'#e91e63','music':'#9b59b6','theater':'#ff9800','food':'#ff5722','sports':'#4caf50','political':'#607d8b','cultural':'#e74c3c','service':'#8bc34a','media':'#3f51b5','other':'#555'}};
const urgColors={{'happening-now':'#ff1744','today':'#ff9100','tomorrow':'#ffea00','this-week':'#76ff03','upcoming':'#40c4ff','timeless':'#666'}};
const yearCmap=i=>{{const t=(i-2017)/9;return `rgb(${{100+t*155|0}},${{200-t*150|0}},${{50+(1-t)*150|0}})`;}}

function getColor(p){{
    const mode=document.getElementById('color-mode').value;
    if(mode==='classify'){{
        if(p.ev===true)return 'rgba(46,204,113,0.7)';
        if(p.ev===false)return 'rgba(231,76,60,0.6)';
        return 'rgba(100,100,100,0.2)';
    }}
    if(mode==='cluster')return clusterColors[p.h]||'#555';
    if(mode==='tag'){{const t=p.t[0];return tagColors[t]||'rgba(80,80,80,0.2)';}}
    if(mode==='org-cat')return orgCatColors[p.oc[0]]||'#555';
    if(mode==='urgency')return urgColors[p.urg]||'rgba(80,80,80,0.2)';
    if(mode==='year')return yearCmap(parseInt(p.d));
    if(mode==='food')return p.food?'rgba(255,87,34,0.8)':'rgba(80,80,80,0.15)';
    return '#666';
}}

function isVisible(p){{
    const ef=document.getElementById('filter-event').value;
    if(ef==='event'&&p.ev!==true)return false;
    if(ef==='not-event'&&p.ev!==false)return false;
    if(ef==='unlabeled'&&p.ev!==null)return false;
    const tf=document.getElementById('filter-tag').value;
    if(tf!=='all'&&!p.t.includes(tf))return false;
    const ocf=document.getElementById('filter-org-cat').value;
    if(ocf!=='all'&&!p.oc.includes(ocf))return false;
    const q=document.getElementById('search').value.toLowerCase();
    if(q&&!p.s.toLowerCase().includes(q)&&!p.a.toLowerCase().includes(q))return false;
    return true;
}}

function toScreen(px,py){{
    return[((px-minX)/rX*(1-2*pad)+pad)*W*scale+ox,((1-(py-minY)/rY)*(1-2*pad)+pad)*H*scale+oy];
}}

let dragging=false,dragStart=null,selRect=null;

function resize(){{
    W=canvas.parentElement.clientWidth;H=canvas.parentElement.clientHeight;
    canvas.width=W*devicePixelRatio;canvas.height=H*devicePixelRatio;
    canvas.style.width=W+'px';canvas.style.height=H+'px';
    ctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0);draw();
}}

function draw(){{
    ctx.clearRect(0,0,W,H);
    const r=Math.max(1.2,2.8/Math.sqrt(scale));
    let vis=0,total=0;
    // Draw hidden first
    for(const p of data){{
        total++;
        if(!isVisible(p)){{
            const[sx,sy]=toScreen(p.x,p.y);
            if(sx>-10&&sx<W+10&&sy>-10&&sy<H+10){{
                ctx.fillStyle='rgba(40,40,40,0.06)';
                ctx.beginPath();ctx.arc(sx,sy,r*0.5,0,6.28);ctx.fill();
            }}
            continue;
        }}
        vis++;
        const[sx,sy]=toScreen(p.x,p.y);
        if(sx<-10||sx>W+10||sy<-10||sy>H+10)continue;
        ctx.fillStyle=getColor(p);
        ctx.beginPath();ctx.arc(sx,sy,r,0,6.28);ctx.fill();
    }}
    if(selRect){{
        ctx.strokeStyle='rgba(255,107,53,0.8)';ctx.lineWidth=1;
        ctx.setLineDash([4,4]);ctx.strokeRect(selRect.x,selRect.y,selRect.w,selRect.h);ctx.setLineDash([]);
    }}
    countEl.textContent=`${{vis.toLocaleString()}}/${{total.toLocaleString()}} visible`;
}}

function findNearest(mx,my,radius=12){{
    let best=null,bestD=radius*radius;
    for(const p of data){{if(!isVisible(p))continue;const[sx,sy]=toScreen(p.x,p.y);const d=(sx-mx)**2+(sy-my)**2;if(d<bestD){{bestD=d;best=p;}}}}
    return best;
}}

function findInRect(x1,y1,x2,y2){{
    const r=[];
    for(const p of data){{if(!isVisible(p))continue;const[sx,sy]=toScreen(p.x,p.y);if(sx>=x1&&sx<=x2&&sy>=y1&&sy<=y2)r.push(p);}}
    return r;
}}

function showCards(emails){{
    if(!emails.length){{cards.innerHTML='<p style="color:#666;font-size:12px;padding:10px;">No emails selected.</p>';
    document.getElementById('sidebar-header').textContent='Click or drag to select';return;}}
    const lim=emails.slice(0,60);
    document.getElementById('sidebar-header').textContent=`${{emails.length}} email${{emails.length>1?'s':''}} selected`;
    cards.innerHTML=lim.map(p=>{{
        const evTag=p.ev===true?'<span class="tag tag-event">EVENT</span>':p.ev===false?'<span class="tag tag-not-event">NOT EVENT</span>':'<span class="tag tag-unknown">UNLABELED</span>';
        const catTags=p.t.map(t=>`<span class="tag tag-cat">${{t}}</span>`).join('');
        const ocTags=p.oc.map(c=>`<span class="tag" style="background:#2a2a3a;color:#aaa;">${{c}}</span>`).join('');
        return `<div class="card">
            <div class="subj">${{p.s}}</div>
            <div class="meta">${{p.d}} · ${{p.a}}${{p.sn?' · 👤 '+p.sn:''}} · C${{p.h}}</div>
            <div class="tags">${{evTag}}${{catTags}}${{ocTags}}</div>
            ${{p.er?'<div style="font-size:10px;color:#666;margin-bottom:4px;">💬 '+p.er+'</div>':''}}
            <div class="body">${{p.b}}</div>
            <a href="${{p.u}}" target="_blank">View on LISTSERV ↗</a>
        </div>`;
    }}).join('');
}}

canvas.addEventListener('mousemove',e=>{{
    const r=canvas.getBoundingClientRect();const mx=e.clientX-r.left,my=e.clientY-r.top;
    if(dragging&&dragStart){{
        const x1=Math.min(dragStart.x,mx),y1=Math.min(dragStart.y,my);
        selRect={{x:x1,y:y1,w:Math.abs(mx-dragStart.x),h:Math.abs(my-dragStart.y)}};draw();return;
    }}
    const p=findNearest(mx,my);
    if(p){{
        tip.style.display='block';tip.style.left=(mx+15)+'px';tip.style.top=(my+15)+'px';
        tip.querySelector('.ts').textContent=p.s;
        const evStr=p.ev===true?'✅ EVENT':p.ev===false?'❌ NOT EVENT':'⬜ unlabeled';
        tip.querySelector('.tm').textContent=`${{p.d}} · ${{p.a}} · ${{evStr}} · ${{p.t.join(', ')||'no tags'}}`;
    }}else tip.style.display='none';
}});
canvas.addEventListener('mousedown',e=>{{dragging=true;const r=canvas.getBoundingClientRect();dragStart={{x:e.clientX-r.left,y:e.clientY-r.top}};}});
canvas.addEventListener('mouseup',e=>{{
    const r=canvas.getBoundingClientRect();const mx=e.clientX-r.left,my=e.clientY-r.top;
    if(selRect&&selRect.w>5){{const emails=findInRect(selRect.x,selRect.y,selRect.x+selRect.w,selRect.y+selRect.h);showCards(emails);}}
    else{{const p=findNearest(mx,my,15);if(p)showCards([p]);}}
    dragging=false;dragStart=null;selRect=null;draw();
}});
canvas.addEventListener('wheel',e=>{{
    e.preventDefault();const r=canvas.getBoundingClientRect();const mx=e.clientX-r.left,my=e.clientY-r.top;
    const f=e.deltaY>0?0.85:1.18;ox=mx-(mx-ox)*f;oy=my-(my-oy)*f;scale*=f;draw();
}},{{passive:false}});
function resetView(){{scale=1;ox=0;oy=0;draw();}}
window.addEventListener('resize',resize);resize();
</script>
</body>
</html>"""

    out_path = DATA_DIR / "assessment_viewer.html"
    with open(out_path, "w") as f:
        f.write(html_content)
    print(f"Saved to {out_path} ({out_path.stat().st_size / 1024 / 1024:.1f} MB)")


if __name__ == "__main__":
    main()
