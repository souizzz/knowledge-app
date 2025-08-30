'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import Head from 'next/head'

type Report = {
    id: number; 
    report_date: string;
    calls: number;
    connects: number;
    docs_sent: number;
    apointments: number;
}

function fmtDate(d = new Date()){
    const tz = new Date (d.getTime() -d.getTimezoneOffset()*60000)
    return tz.toISOString().slice(0,10)
}

export default function SalesForm(){
    const [date, setDate] = useState(fmtDate())
    const [calls, setCalls] =useState(0)
    const [connects, setConnects ] = useState(0)
    const [docsSent, setDocsSent] = useState(0)
    const [apointments, setApointments] = useState(0)
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [me, setMe] = useState<string | null>(null)
    const [history, setHistory] = useState<Report[]>([])
    const canSubmit = me && calls > 0 && connects > 0 && docsSent > 0 && apointments > 0 && !!date
    
    // Version info for cache busting
    const VERSION = "v2.1.0"
    const CACHE_BUST = Date.now()

    // Force cache busting by updating URL
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const url = new URL(window.location.href);
            url.searchParams.set('v', VERSION);
            url.searchParams.set('cb', CACHE_BUST.toString());
            window.history.replaceState({}, '', url.toString());
        }
    }, []);

    //認証状態と直近の履歴を確認
    useEffect(() => {
        // サブスクリプション用の変数
        let sub: ReturnType<typeof supabase.auth.onAuthStateChange>['data'] | null = null;

        // 現在のユーザー情報を取得
        supabase.auth.getUser().then(({ data, error }) => {
            if (!error) setMe(data.user?.id ?? null);
        });

        // 認証状態の変化を監視
        sub = supabase.auth.onAuthStateChange((event, session) => {
            setMe(session?.user?.id ?? null);
        }).data;

        return () => {
            sub?.subscription.unsubscribe();
        };
    }, []);

    useEffect(() => {
        if (!me) {setHistory([]); return }
        const from = new Date(date)
        from.setDate(from.getDate() -14)
        const fromStr = fmtDate(from)

        supabase.from('sales_forms')
            .select('id, report_date, calls, connects, docs_sent, apointments')
            .gte('report_date', fromStr)
            .order('report_date', { ascending: false })
            .then(({ data, error }) => {
                if(error) {
                    console.warn('Sales forms table not found or error:', error.message);
                    console.log('Debug: Using new sales_forms table implementation');
                    setHistory([]);
                    return;
                }
                console.log('Debug: Successfully fetched sales data:', data?.length || 0, 'records');
                setHistory((data as Report[]) ?? [])
                const today = (data as Report[])?.find(r => r.report_date === date)
                if(today) {
                    console.log('Debug: Found today data:', today);
                    setCalls(today.calls)
                    setConnects(today.connects)
                    setDocsSent(today.docs_sent)
                    setApointments(today.apointments)
                } else {
                    console.log('Debug: No data found for today:', date);
                }
            })
    }, [me, date])

    async function onSubmit() {
        if(!canSubmit) return
        setLoading(true); setError('');

        const { data: userRes } = await supabase.auth.getUser()
        const user = userRes.user
        if (!user) { setLoading(false); setError('ログインしてください'); return}
        
        const { error } = await supabase
            .from('sales_forms')
            .upsert({
                report_date: date,
                user_id: user.id,
                calls,
                connects,
                docs_sent: docsSent,
                apointments: apointments,
            })
            .select()

        setLoading(false)
        if(error) {
            console.error('Failed to save sales data:', error.message);
            setError('データの保存に失敗しました。テーブルが存在しない可能性があります。');
            return;
        }

        const from = new Date(date); from.setDate(from.getDate() -14)
        const { data: refeched, error: refetchError} = await supabase
            .from('sales_forms')
            .select('id, report_date, calls, connects, docs_sent, apointments')
            .gte('report_date', fmtDate(from))
            .order('report_date', { ascending: false })
        
        if (refetchError) {
            console.warn('Failed to refetch sales data:', refetchError.message);
        } else {
            setHistory((refeched as Report[]) ?? [])
        }
    }
        
    return (
        <>
            <Head>
                <title>営業数値管理 {VERSION}</title>
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <meta httpEquiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
                <meta httpEquiv="Pragma" content="no-cache" />
                <meta httpEquiv="Expires" content="0" />
            </Head>
            <div>
                <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem', color: '#1f2937' }}>
                    営業数値管理 {VERSION}
                </h1>
            <div style={{ 
                padding: '0.5rem', 
                backgroundColor: '#f3f4f6', 
                borderRadius: '0.5rem', 
                fontSize: '0.875rem',
                color: '#6b7280',
                marginBottom: '1rem'
            }}>
                <strong>デバッグ情報:</strong> バージョン {VERSION} | 最終更新: {new Date().toLocaleString('ja-JP')}<br/>
                <strong>URL:</strong> {typeof window !== 'undefined' ? window.location.href : 'Loading...'}<br/>
                <button 
                    onClick={() => window.location.reload()} 
                    style={{
                        marginTop: '0.5rem',
                        padding: '0.25rem 0.5rem',
                        backgroundColor: '#ef4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.25rem',
                        cursor: 'pointer',
                        fontSize: '0.75rem'
                    }}
                >
                    強制リロード
                </button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} style={{ display: 'grid', gap: '1rem' }}>
                <label>
                    日付
                    <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <label>架電数
                        <input type="number" value={calls} onChange={(e) => setCalls(Number(e.target.value))} />
                    </label>
                    <label>担当者接続数
                        <input type="number" value={connects} onChange={(e) => setConnects(Number(e.target.value))} />
                    </label>
                    <label>資料送付数
                        <input type="number" value={docsSent} onChange={(e) => setDocsSent(Number(e.target.value))} />
                    </label>
                    <label>アポ数
                        <input type="number" value={apointments} onChange={(e) => setApointments(Number(e.target.value))} />
                    </label>
                </div>
                    <button disabled={!canSubmit || loading} type="submit">
                        {loading ? '送信中...' : '送信'}
                    </button>
                    {error && <p style={{color:'crimson'}}>エラー: {error}</p>}
                    {!me && <p>※ ログイン後に入力できます。</p>}
            </form>

            <hr style={{ margin: '24px 0' }} />

            <h2 style={{ fontSize: 18, fontWeight: '700', marginBottom: 8 }}>直近の記録</h2>
            <div style={{overflowX: 'auto'}}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr>
                        <th style={{textAlign:'left', borderBottom:'1px solid #ddd'}}>日付</th>
                        <th style={{textAlign:'right', borderBottom:'1px solid #ddd'}}>架電</th>
                        <th style={{textAlign:'right', borderBottom:'1px solid #ddd'}}>接続</th>
                        <th style={{textAlign:'right', borderBottom:'1px solid #ddd'}}>資料</th>
                        <th style={{textAlign:'right', borderBottom:'1px solid #ddd'}}>アポ</th>
                        </tr>
                    </thead>
                    <tbody>
                        {history.map(r=>
                            <tr key={r.id}>
                                <td style={{padding: '6px 4px'}}>{r.report_date}</td>
                                <td style={{padding: '6px 4px', textAlign:'right'}}>{r.calls}</td>
                                <td style={{padding: '6px 4px', textAlign:'right'}}>{r.connects}</td>
                                <td style={{padding: '6px 4px', textAlign:'right'}}>{r.docs_sent}</td>
                                <td style={{padding: '6px 4px', textAlign:'right'}}>{r.apointments}</td>
                            </tr>
                        )}
                        {history.length === 0 && <tr><td colSpan={5} style={{padding:'8px', color:'#ddd'}}>記録がありません</td></tr>}
                    </tbody>
                </table>
            </div>
            </div>
        </>
    )
}
