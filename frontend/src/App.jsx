import { useState, useEffect, useCallback, useRef } from 'react'
import * as d3 from 'd3'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'

const API = 'http://localhost:5184'

const SEV_COLOR = { CRITICAL: '#e24b4a', HIGH: '#ef9f27', MEDIUM: '#378add', LOW: '#1d9e75', UNKNOWN: '#4b5563' }

function useFetch(url, interval = 30000) {
  const [data, setData] = useState(null)
  const fetch_ = useCallback(() => {
    fetch(url).then(r => r.json()).then(setData).catch(() => {})
  }, [url])
  useEffect(() => { fetch_(); const t = setInterval(fetch_, interval); return () => clearInterval(t) }, [fetch_, interval])
  return data
}

function Metric({ label, value, color, sub }) {
  return (
    <div style={{ flex: 1, padding: '14px 16px', borderRight: '0.5px solid #1e2530' }}>
      <div style={{ fontSize: 10, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 500, color: color || '#e2e8f0' }}>{value ?? '—'}</div>
      {sub && <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>{sub}</div>}
    </div>
  )
}

function PulsingDot({ color = '#1d9e75' }) {
  return (
    <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: color, marginRight: 6,
      animation: 'pulse 2s infinite' }} />
  )
}


function ChainGraph() {
  const [chains, setChains] = useState(null)
  const [selected, setSelected] = useState(null)
  const svgRef = useRef(null)

  useEffect(() => {
    fetch('http://localhost:5184/api/chains')
      .then(r => r.json())
      .then(data => { setChains(data) })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!chains || !svgRef.current) return
    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const w = svgRef.current.clientWidth || 800
    const h = 500

    const nodes = {}
    chains.forEach(c => {
      if (!nodes[c.source]) nodes[c.source] = { id: c.source, sev: c.source_sev, epss: c.source_epss, desc: c.source_desc }
      if (!nodes[c.target]) nodes[c.target] = { id: c.target, sev: c.target_sev, epss: c.target_epss, desc: c.target_desc }
    })

    const nodeArr = Object.values(nodes)
    const linkArr = chains.map(c => ({ source: c.source, target: c.target, days: c.days_apart }))

    const color = sev => ({ CRITICAL:'#e24b4a', HIGH:'#ef9f27', MEDIUM:'#378add', LOW:'#1d9e75' }[sev] || '#4b5563')

    const sim = d3.forceSimulation(nodeArr)
      .force('link', d3.forceLink(linkArr).id(d => d.id).distance(80))
      .force('charge', d3.forceManyBody().strength(-200))
      .force('center', d3.forceCenter(w/2, h/2))
      .force('collision', d3.forceCollide().radius(30))
      .force('x', d3.forceX(w/2).strength(0.05))
      .force('y', d3.forceY(h/2).strength(0.05))

    const g = svg.append('g')

    svg.call(d3.zoom()
      .scaleExtent([0.3, 3])
      .filter(e => e.type !== 'wheel')
      .on('zoom', e => g.attr('transform', e.transform)))

    const link = g.append('g').selectAll('line')
      .data(linkArr).join('line')
      .attr('stroke', '#2a3545')
      .attr('stroke-width', d => d.days === 0 ? 2 : 1)
      .attr('stroke-dasharray', d => d.days === 0 ? null : '4 2')

    const node = g.append('g').selectAll('circle')
      .data(nodeArr).join('circle')
      .attr('r', d => 6 + (d.epss || 0) * 14)
      .attr('fill', d => color(d.sev))
      .attr('opacity', 0.85)
      .attr('cursor', 'pointer')
      .on('click', (e, d) => setSelected(d))
      .call(d3.drag()
        .on('start', (e, d) => { if (!e.active) sim.alphaTarget(0.3).restart(); d.fx=d.x; d.fy=d.y })
        .on('drag',  (e, d) => { d.fx=e.x; d.fy=e.y })
        .on('end',   (e, d) => { if (!e.active) sim.alphaTarget(0); d.fx=null; d.fy=null }))

    const label = g.append('g').selectAll('text')
      .data(nodeArr).join('text')
      .text(d => d.id)
      .attr('font-size', 9)
      .attr('fill', '#94a3b8')
      .attr('text-anchor', 'middle')
      .attr('dy', -12)
      .attr('pointer-events', 'none')

    sim.on('tick', () => {
      nodeArr.forEach(d => {
        d.x = Math.max(20, Math.min(w - 20, d.x))
        d.y = Math.max(20, Math.min(h - 20, d.y))
      })
      link.attr('x1', d => d.source.x).attr('y1', d => d.source.y)
          .attr('x2', d => d.target.x).attr('y2', d => d.target.y)
      node.attr('cx', d => d.x).attr('cy', d => d.y)
      label.attr('x', d => d.x).attr('y', d => d.y)
    })

    return () => sim.stop()
  }, [chains])

  return (
    <div style={{ display:'flex', flex:1, flexDirection:'column' }}>
      <div style={{ padding:'8px 16px', fontSize:11, color:'#4b5563', borderBottom:'0.5px solid #1e2530',
        display:'flex', justifyContent:'space-between' }}>
        <span>chain graph — CVEs exploited within 72h windows — node size = EPSS score</span>
        <span style={{ color:'#1d9e75' }}>{chains ? chains.length + ' chains detected' : 'loading...'}</span>
      </div>
      <div style={{ display:'flex', flex:1 }}>
        <svg ref={svgRef} style={{ flex:1, background:'#080b10', minHeight:500 }} />
        {selected && (
          <div style={{ width:260, padding:14, borderLeft:'0.5px solid #1e2530', overflowY:'auto' }}>
            <div style={{ fontSize:12, color:'#378add', fontWeight:500, marginBottom:8 }}>{selected.id}</div>
            <div style={{ fontSize:10, color:'#4b5563', marginBottom:4 }}>severity</div>
            <div style={{ fontSize:12, color: selected.sev==='CRITICAL'?'#e24b4a':'#ef9f27', marginBottom:8 }}>{selected.sev}</div>
            <div style={{ fontSize:10, color:'#4b5563', marginBottom:4 }}>EPSS score</div>
            <div style={{ fontSize:12, color:'#c8d0dc', marginBottom:8 }}>{selected.epss ? (selected.epss*100).toFixed(2)+'%' : '?'}</div>
            <div style={{ fontSize:10, color:'#4b5563', marginBottom:4 }}>description</div>
            <div style={{ fontSize:11, color:'#6b7280', lineHeight:1.6 }}>{selected.desc}</div>
            <button onClick={() => setSelected(null)}
              style={{ marginTop:12, padding:'4px 10px', background:'transparent',
                border:'0.5px solid #2a3545', borderRadius:4, color:'#64748b',
                cursor:'pointer', fontSize:11, fontFamily:'inherit' }}>
              close
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function App() {
  const metrics  = useFetch(`${API}/api/metrics`, 10000)
  const threats  = useFetch(`${API}/api/threats/top?limit=20`, 30000)
  const heatmap  = useFetch(`${API}/api/heatmap`, 60000)
  const [selected, setSelected] = useState(null)
  const [detail, setDetail]     = useState(null)
  const [tab, setTab]           = useState('warroom')
  const [clock, setClock]       = useState(new Date())
  const [scanInput, setScanInput] = useState('')
  const [scanTags, setScanTags]   = useState(['flask==2.1.0', 'openssl==1.1.1', 'log4j==2.14.0'])

  useEffect(() => { const t = setInterval(() => setClock(new Date()), 1000); return () => clearInterval(t) }, [])

  useEffect(() => {
    if (!selected) return
    fetch(`${API}/api/cves/${selected}`).then(r => r.json()).then(setDetail).catch(() => {})
  }, [selected])

  const heatData = heatmap
    ? Object.entries(
        heatmap.reduce((acc, r) => {
          const h = new Date(r.bucket).getHours()
          acc[h] = (acc[h] || 0) + Number(r.cve_count)
          return acc
        }, {})
      ).map(([h, count]) => ({ hour: `${h}:00`, count }))
    : []

  const sevData = threats
    ? Object.entries(threats.reduce((acc, t) => { acc[t.severity || 'UNKNOWN'] = (acc[t.severity || 'UNKNOWN'] || 0) + 1; return acc }, {}))
        .map(([sev, count]) => ({ sev, count, fill: SEV_COLOR[sev] }))
    : []

  const tabs = ['warroom', 'threats', 'scanner', 'chain', 'carbon']

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        .cve-row:hover { background: #0e1520 !important; cursor: pointer; }
        .nav-btn { background: transparent; border: 0.5px solid transparent; color: #64748b; padding: 5px 14px;
          border-radius: 6px; cursor: pointer; font-family: inherit; font-size: 12px; }
        .nav-btn.active { background: #1a2030; color: #c8d0dc; border-color: #2a3545; }
        .nav-btn:hover { color: #c8d0dc; }
        .tag { display:inline-block; padding: 3px 8px; border-radius: 4px; font-size: 11px;
          background: #1a1f35; border: 0.5px solid #378add; color: #378add; margin: 3px; cursor:pointer; }
        .tag:hover { background: #1e2a45; }
      `}</style>

      {/* Top bar */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 16px',
        background:'#0e1117', borderBottom:'0.5px solid #1e2530' }}>
        <div style={{ display:'flex', alignItems:'center', gap: 8, fontWeight: 500, fontSize: 14, color:'#e2e8f0' }}>
          <PulsingDot color="#e24b4a" />
          SENTINEL
          <span style={{ fontSize:10, color:'#374151', marginLeft:4 }}>temporal threat intelligence</span>
        </div>
        <div style={{ display:'flex', gap:16, fontSize:11, color:'#64748b' }}>
          <span style={{ color:'#1d9e75' }}>TimescaleDB connected</span>
          <span>|</span>
          <span style={{ color:'#ef9f27' }}>{metrics ? `${Number(metrics.total).toLocaleString()} CVEs` : '...'}</span>
          <span>|</span>
          <span style={{ color:'#e24b4a' }}>{metrics ? `${metrics.kev} KEV confirmed` : '...'}</span>
          <span>|</span>
          <span>{clock.toTimeString().slice(0,8)}</span>
        </div>
      </div>

      {/* Nav */}
      <div style={{ display:'flex', gap:4, padding:'8px 16px', background:'#0e1117', borderBottom:'0.5px solid #1e2530' }}>
        {tabs.map(t => (
          <button key={t} className={`nav-btn ${tab===t?'active':''}`} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>

      {/* Metrics strip */}
      <div style={{ display:'flex', borderBottom:'0.5px solid #1e2530' }}>
        <Metric label="total CVEs"     value={metrics ? Number(metrics.total).toLocaleString() : '—'} />
        <Metric label="critical"       value={metrics ? Number(metrics.critical).toLocaleString() : '—'} color="#e24b4a" />
        <Metric label="KEV confirmed"  value={metrics ? Number(metrics.kev).toLocaleString() : '—'} color="#ef9f27" sub="actively exploited" />
        <Metric label="EPSS scored"    value={metrics ? Number(metrics.scored).toLocaleString() : '—'} color="#378add" />
        <Metric label="threat level"   value="HIGH" color="#ef9f27" sub="3 chains detected" />
      </div>

      {/* War room */}
      {tab === 'warroom' && (
        <div style={{ display:'flex', flex:1 }}>
          <div style={{ flex:1, display:'flex', flexDirection:'column' }}>
            {/* Heatmap */}
            <div style={{ padding:'12px 16px', borderBottom:'0.5px solid #1e2530' }}>
              <div style={{ fontSize:11, color:'#4b5563', marginBottom:8 }}>
                CVE activity — last 24h by hour (from threat_scores_1h cagg)
              </div>
              <ResponsiveContainer width="100%" height={80}>
                <BarChart data={heatData} margin={{ top:0, right:0, bottom:0, left:0 }}>
                  <XAxis dataKey="hour" tick={{ fill:'#374151', fontSize:9 }} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip contentStyle={{ background:'#0e1117', border:'0.5px solid #2a3545', color:'#c8d0dc', fontSize:11 }} />
                  <Bar dataKey="count" fill="#378add" radius={[2,2,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* CVE feed */}
            <div style={{ flex:1, overflowY:'auto' }}>
              <div style={{ padding:'8px 16px', fontSize:11, color:'#4b5563', borderBottom:'0.5px solid #111820',
                display:'flex', justifyContent:'space-between' }}>
                <span>live threat feed — top EPSS + KEV</span>
                <span style={{ color:'#1d9e75' }}>● streaming</span>
              </div>
              {threats?.map((t, i) => (
                <div key={i} className="cve-row"
                  style={{ display:'flex', alignItems:'flex-start', gap:10, padding:'9px 14px',
                    borderBottom:'0.5px solid #111820', background: selected===t.cve_id ? '#0e1520' : 'transparent' }}
                  onClick={() => setSelected(t.cve_id)}>
                  <div style={{ width:6, height:6, borderRadius:'50%', background: SEV_COLOR[t.severity||'UNKNOWN'],
                    marginTop:5, flexShrink:0 }} />
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:12, color:'#378add', fontWeight:500 }}>
                      {t.cve_id}
                      {t.is_kev && <span style={{ marginLeft:8, fontSize:9, padding:'2px 5px', borderRadius:3,
                        background:'#3d1515', color:'#e24b4a' }}>KEV</span>}
                    </div>
                    <div style={{ fontSize:11, color:'#6b7280', marginTop:2, overflow:'hidden',
                      textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{t.description}</div>
                    <div style={{ display:'flex', gap:12, marginTop:4, fontSize:10, color:'#4b5563' }}>
                      <span>CVSS: {t.cvss ?? '?'}</span>
                      <span>EPSS: {t.epss ? (t.epss*100).toFixed(1)+'%' : '?'}</span>
                      <span>age: {t.exposure_age}</span>
                    </div>
                  </div>
                  <div style={{ fontSize:10, color: SEV_COLOR[t.severity||'UNKNOWN'], flexShrink:0 }}>
                    {t.severity||'?'}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Detail panel */}
          <div style={{ width:280, borderLeft:'0.5px solid #1e2530', display:'flex', flexDirection:'column' }}>
            {detail ? (
              <div style={{ padding:14, overflowY:'auto' }}>
                <div style={{ fontSize:13, color:'#378add', fontWeight:500, marginBottom:8 }}>{detail.cve_id}</div>
                {detail.is_kev && (
                  <div style={{ padding:'4px 8px', background:'#3d1515', border:'0.5px solid #e24b4a',
                    borderRadius:4, fontSize:10, color:'#e24b4a', marginBottom:10 }}>
                    *** KEV — ACTIVELY EXPLOITED ***
                  </div>
                )}
                {[
                  ['severity',    detail.severity],
                  ['CVSS score',  detail.cvss_score],
                  ['EPSS score',  detail.epss_score ? (detail.epss_score*100).toFixed(2)+'%' : null],
                  ['published',   detail.published?.slice(0,10)],
                  ['KEV added',   detail.kev_added_date],
                  ['patch avail', detail.patch_available ? 'YES' : 'NO'],
                ].map(([k,v]) => v != null && (
                  <div key={k} style={{ display:'flex', justifyContent:'space-between', marginBottom:6,
                    fontSize:11, borderBottom:'0.5px solid #111820', paddingBottom:5 }}>
                    <span style={{ color:'#4b5563' }}>{k}</span>
                    <span style={{ color:'#c8d0dc' }}>{v}</span>
                  </div>
                ))}
                <div style={{ fontSize:10, color:'#4b5563', marginTop:8, marginBottom:4 }}>description</div>
                <div style={{ fontSize:11, color:'#6b7280', lineHeight:1.6 }}>{detail.description}</div>
                {detail.cvss_vector && (
                  <>
                    <div style={{ fontSize:10, color:'#4b5563', marginTop:10, marginBottom:4 }}>CVSS vector</div>
                    <div style={{ fontSize:10, color:'#374151', wordBreak:'break-all' }}>{detail.cvss_vector}</div>
                  </>
                )}
              </div>
            ) : (
              <div style={{ padding:14, color:'#374151', fontSize:11 }}>
                Click a CVE to see details
              </div>
            )}

            {/* Severity chart */}
            <div style={{ padding:14, borderTop:'0.5px solid #1e2530' }}>
              <div style={{ fontSize:10, color:'#4b5563', marginBottom:8 }}>severity distribution</div>
              <ResponsiveContainer width="100%" height={80}>
                <BarChart data={sevData} margin={{ top:0, right:0, bottom:0, left:0 }}>
                  <XAxis dataKey="sev" tick={{ fill:'#374151', fontSize:9 }} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip contentStyle={{ background:'#0e1117', border:'0.5px solid #2a3545', color:'#c8d0dc', fontSize:11 }} />
                  <Bar dataKey="count" radius={[2,2,0,0]}>
                    {sevData.map((e, i) => <rect key={i} fill={e.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Threats tab */}
      {tab === 'threats' && (
        <div style={{ padding:16, overflowY:'auto' }}>
          <div style={{ fontSize:11, color:'#4b5563', marginBottom:12 }}>
            top threats — ranked by KEV status + EPSS score
          </div>
          {threats?.map((t, i) => (
            <div key={i} style={{ padding:'10px 14px', marginBottom:6, border:'0.5px solid #1e2530',
              borderRadius:8, borderLeft:`3px solid ${SEV_COLOR[t.severity||'UNKNOWN']}` }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                <span style={{ color:'#378add', fontSize:12, fontWeight:500 }}>{t.cve_id}</span>
                <span style={{ fontSize:10, color: SEV_COLOR[t.severity||'UNKNOWN'] }}>{t.severity}</span>
              </div>
              <div style={{ fontSize:11, color:'#6b7280', marginBottom:6 }}>{t.description}</div>
              <div style={{ display:'flex', gap:16, fontSize:10, color:'#4b5563' }}>
                <span>CVSS: {t.cvss}</span>
                <span style={{ color: t.epss > 0.5 ? '#e24b4a' : '#4b5563' }}>
                  EPSS: {t.epss ? (t.epss*100).toFixed(1)+'%' : '?'}
                </span>
                <span>age: {t.exposure_age}</span>
                {t.is_kev && <span style={{ color:'#e24b4a' }}>KEV ✓</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Scanner tab */}
      {tab === 'scanner' && (
        <div style={{ padding:16 }}>
          <div style={{ fontSize:11, color:'#4b5563', marginBottom:12 }}>
            stack scanner — add packages to check for vulnerabilities
          </div>
          <div style={{ display:'flex', gap:8, marginBottom:12 }}>
            <input value={scanInput} onChange={e => setScanInput(e.target.value)}
              placeholder="e.g. django==3.2.0"
              onKeyDown={e => { if(e.key==='Enter' && scanInput.trim()) {
                setScanTags([...scanTags, scanInput.trim()]); setScanInput('') }}}
              style={{ flex:1, padding:'6px 10px', background:'#111820', border:'0.5px solid #2a3545',
                borderRadius:6, color:'#c8d0dc', fontFamily:'inherit', fontSize:12 }} />
            <button onClick={() => { if(scanInput.trim()) { setScanTags([...scanTags, scanInput.trim()]); setScanInput('') }}}
              style={{ padding:'6px 12px', background:'#1a1f35', border:'0.5px solid #378add',
                borderRadius:6, color:'#378add', cursor:'pointer', fontFamily:'inherit' }}>
              + add
            </button>
          </div>
          <div style={{ marginBottom:16 }}>
            {scanTags.map((tag, i) => (
              <span key={i} className="tag" onClick={() => setScanTags(scanTags.filter((_,j)=>j!==i))}>
                {tag} ×
              </span>
            ))}
          </div>
          <div style={{ padding:12, background:'#0e1117', borderRadius:8, border:'0.5px solid #1e2530',
            fontSize:11, color:'#4b5563' }}>
            Run the OSV scanner from terminal:<br/>
            <span style={{ color:'#378add' }}>python3 ingestion/workers/osv_worker.py test_stack.txt</span><br/><br/>
            Full API integration coming in Step 8.
          </div>
        </div>
      )}

      {/* Carbon dating tab */}
      {tab === 'chain' && (
        <ChainGraph />
      )}

      {tab === 'carbon' && (
        <div style={{ padding:16 }}>
          <div style={{ fontSize:11, color:'#4b5563', marginBottom:12 }}>
            carbon dating — EPSS decay curves (click a CVE in war room first)
          </div>
          {selected ? (
            <CarbonChart cveId={selected} />
          ) : (
            <div style={{ color:'#374151', fontSize:11 }}>
              Go to war room tab and click a CVE to see its carbon dating curve.
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function CarbonChart({ cveId }) {
  const data = useFetch(`http://localhost:5184/api/carbon/${cveId}`, 0)
  if (!data) return <div style={{ color:'#374151' }}>Loading...</div>
  if (!data.points?.length) return <div style={{ color:'#374151' }}>No EPSS history yet for {cveId}</div>
  return (
    <div>
      <div style={{ fontSize:12, color:'#378add', marginBottom:8 }}>{cveId} — EPSS over time</div>
      <div style={{ fontSize:10, color:'#4b5563', marginBottom:12 }}>{data.days} days of data</div>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data.points}>
          <XAxis dataKey="date" tick={{ fill:'#374151', fontSize:9 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill:'#374151', fontSize:9 }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={{ background:'#0e1117', border:'0.5px solid #2a3545', color:'#c8d0dc', fontSize:11 }} />
          <Line type="monotone" dataKey="avg_epss" stroke="#e24b4a" dot={false} strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
