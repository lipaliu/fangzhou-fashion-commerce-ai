import json, shutil, pathlib, re, argparse
ROOT=pathlib.Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser(description='Build the manually reviewed 2026-10-09 research snapshot from a CUA export and its local cover bundles.')
parser.add_argument('scout_export', type=pathlib.Path, help='JSON with rows, bundles, directCovers; cover paths must exist locally')
args = parser.parse_args()
raw=json.loads(args.scout_export.read_text())
(ROOT/'dist/mira-templates/assets/creators').mkdir(parents=True, exist_ok=True)
exclude=set('番茄沙司Tomato|美嘉|剪映小野|海南船长|夹欣说剪辑|奶油剪刀手|落落的AIGC学习|智子AI|Pixelii|陈伟|陈三园AI电商|杨羽恩小朋友|伟强|骑蜗牛追导弹|超人不会fly|Vivian大马|泰顺农商银行|小黄的AI日记|ai的三行诗|正经的特效师|默默安|录无艳|半条瑜伽裤|41571214181|holle|李泱泱|曦尹|洢社长|X小姐的AI工坊|POP'.split('|'))
assets={a['url']:a['path'] for b in raw['bundles'] for a in b['assets']}
direct={r['sourceId']:r['path'] for r in raw['directCovers']}
byname={}
for row in raw['rows']:
 if row['creator'] not in exclude and row['creator'] not in byname:byname[row['creator']]=row
# Prefer the explicit doll-change example for this creator, retaining the other source in raw evidence.
byname['张脑丸儿🧠']=next(r for r in raw['rows'] if r['sourceId']=='7672357335758556426')
priority='一瓶酱|禾子陈|有点意施|原来是陶阿狗君|吉子范范|李马特|偷偷狗totogo|张脑丸儿🧠|UrbanSlide|吉吉不急|泮家豪|阿力裟|十八闲客户|其寺Mar|碳酸饮料拜拜|你好卡农|胡楚麒🐸|安安崽An|叫我kiki|鱼一'.split('|')
rows=sorted(byname.values(),key=lambda r:priority.index(r['creator']) if r['creator'] in priority else 100)[:100]
profiles={'原来是陶阿狗君':'https://www.douyin.com/user/MS4wLjABAAAAscoMhrO7wM5_fAcVWeL4rYpxkm6wPoZjec5pVUHmRXw'}
mechanisms=[('真人娃娃','真人娃娃换装'),('风扇','风扇遮挡换装'),('衣服飞','悬浮衣服上身'),('拉幕','拉幕换装'),('电梯','电梯换装'),('旋转','旋转换装'),('响指','响指换装'),('拍手','拍手换装'),('站着不动','运镜换装'),('机票','机票场景转场'),('歌单','歌单切换'),('滚动','滚动转场'),('电车','电车遮挡'),('路人','路人遮挡'),('牵手','牵手转场'),('滑步','滑步换装'),('被操控','互动操控'),('小游戏','互动换装'),('走路','走路匹配剪辑')]
result=[]
for i,r in enumerate(rows,1):
 title=r['title'].strip(); mechanism=next((v for k,v in mechanisms if k in title),None)
 transition=bool(mechanism or re.search('转场|变装|换装|卡点|fit.?check',title,re.I))
 group='transition' if transition else 'presentation'
 mechanism=mechanism or ('穿搭转场' if transition else '场景穿搭展示')
 p=direct.get(r['sourceId']) or assets.get(r.get('poster'))
 poster=r.get('poster','')
 if p:
  dest=ROOT/'dist/mira-templates/assets/creators'/f"{r['sourceId']}.jpg"
  shutil.copyfile(p,dest);poster='assets/creators/'+dest.name
 ai='作者文案提及豆包；实际制作方式待拆解' if '豆包' in title else '未核验，不根据画面认定 AI 制作'
 result.append(dict(id='dy-'+r['sourceId'],rank=i,creator=r['creator'],title=mechanism,platform='douyin',url='https://www.douyin.com/video/'+r['sourceId'],profileUrl=profiles.get(r['creator']),sourceTitle=title,poster=poster,group=group,tags=[mechanism],aiEvidence=ai,sourceDate=r.get('date','').strip(' ·'),duration=r.get('duration',''),likesText=r.get('likes',''),collectedAt='2026-10-09',verification='已核对站内作品索引与封面；完整视频待拆解',note=('适合评估开场触发动作、换装衔接与可替换槽位。' if transition else '适合评估换装后的动作、场景互动与景别组合。'),evidence='抖音站内公开搜索 · 标题与作者对应已核对'))
assert len(result)==100,len(result)
(ROOT/'dist/mira-templates/creators.json').write_text(json.dumps(result,ensure_ascii=False,indent=2))
# Public evidence only; strip machine-specific artifact locations from the handoff.
(ROOT/'docs/mira/research/douyin-sources-20261009.json').write_text(json.dumps({'collectedAt':raw['collectedAt'],'method':'抖音已登录站内搜索：穿搭转场、悬浮换装、气质穿搭 韩系穿搭。按作者显示名去重；非实时热榜，未逐条观看原片。','rows':raw['rows'],'excludedCreators':sorted(exclude)},ensure_ascii=False,indent=2))
md=['# Mira 抖音账号参考库 · 2026-10-09','', '100 个公开账号候选，以代表作品识别来源；不是 100 个已证实的 AI 批量账号。优先服务开场转场和后段模特展示。除注明主页核验的条目外，作者身份依据站内搜索结果，尚未逐主页检查更新频率。','', '| 序号 | 账号 | 玩法线索 | 代表作 |','|---|---|---|---|']
for r in result:md.append(f"| {r['rank']} | {r['creator']} | {r['title']} | [抖音原作]({r['url']}) |")
(ROOT/'docs/mira/research/100-douyin-creators.md').write_text('\n'.join(md)+'\n')
print(json.dumps({'count':len(result),'groups':{g:sum(r['group']==g for r in result) for g in ['transition','presentation']},'missingLocalCovers':[(r['creator'],r['id']) for r in result if not r['poster'].startswith('assets/')]},ensure_ascii=False))
