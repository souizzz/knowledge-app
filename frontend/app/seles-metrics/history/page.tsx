'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'

type Report = {
    id: number; 
    report_date: string;
    calls: number;
    connects: number;
    docs_sent: number;
    apointments: number;
    created_at: string;
}

type ChartData = {
    date: string;
    calls: number;
    connects: number;
    docs_sent: number;
    apointments: number;
}

export default function HistoryPage() {
    const [history, setHistory] = useState<Report[]>([])
    const [loading, setLoading] = useState(false)
    const [me, setMe] = useState<string | null>(null)
    const [dateRange, setDateRange] = useState({
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        end: new Date().toISOString().slice(0, 10)
    })
    const [chartData, setChartData] = useState<ChartData[]>([])
    const [selectedMetric, setSelectedMetric] = useState('calls')

    // 認証状態を確認
    useEffect(() => {
        let sub: ReturnType<typeof supabase.auth.onAuthStateChange>['data'] | null = null;

        supabase.auth.getUser().then(({ data, error }) => {
            if (!error) setMe(data.user?.id ?? null);
        });

        sub = supabase.auth.onAuthStateChange((event, session) => {
            setMe(session?.user?.id ?? null);
        }).data;

        return () => {
            sub?.subscription.unsubscribe();
        };
    }, []);

    // 履歴データを取得
    useEffect(() => {
        if (!me) return;
        
        const fetchHistory = async () => {
            setLoading(true);
            
            const { data, error } = await supabase
                .from('sales_forms')
                .select('*')
                .eq('user_id', me)
                .gte('report_date', dateRange.start)
                .lte('report_date', dateRange.end)
                .order('report_date', { ascending: true });
            
            if (error) {
                console.warn('履歴データの取得に失敗:', error.message);
                setHistory([]);
                setChartData([]);
                return;
            }
            
            setHistory(data || []);
            
            // チャート用データを準備
            if (data) {
                const chartData = data.map(item => ({
                    date: item.report_date,
                    calls: item.calls,
                    connects: item.connects,
                    docs_sent: item.docs_sent,
                    apointments: item.apointments
                }));
                setChartData(chartData);
            }
            
            setLoading(false);
        };
        
        fetchHistory();
    }, [me, dateRange]);

    const metrics = [
        { value: 'calls', label: '架電数', color: '#3b82f6' },
        { value: 'connects', label: '担当者接続数', color: '#10b981' },
        { value: 'docs_sent', label: '資料送付数', color: '#f59e0b' },
        { value: 'apointments', label: 'アポ数', color: '#ef4444' }
    ];

    const getMetricValue = (item: ChartData, metric: string) => {
        switch (metric) {
            case 'calls': return item.calls;
            case 'connects': return item.connects;
            case 'docs_sent': return item.docs_sent;
            case 'apointments': return item.apointments;
            default: return 0;
        }
    };

    const getMetricLabel = (metric: string) => {
        return metrics.find(m => m.value === metric)?.label || metric;
    };

    const getMetricColor = (metric: string) => {
        return metrics.find(m => m.value === metric)?.color || '#3b82f6';
    };

    const calculateTotal = (metric: string) => {
        return chartData.reduce((sum, item) => sum + getMetricValue(item, metric), 0);
    };

    const calculateAverage = (metric: string) => {
        if (chartData.length === 0) return 0;
        return Math.round(calculateTotal(metric) / chartData.length * 10) / 10;
    };

    const calculateMax = (metric: string) => {
        if (chartData.length === 0) return 0;
        return Math.max(...chartData.map(item => getMetricValue(item, metric)));
    };

    return (
        <div>
                <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1.5rem', color: '#1f2937' }}>
                    数値履歴
                </h1>
                
                {/* 日付範囲選択 */}
                <div style={{ 
                    backgroundColor: '#ffffff', 
                    padding: '1.5rem', 
                    borderRadius: '0.5rem', 
                    border: '1px solid #e5e7eb',
                    marginBottom: '2rem'
                }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', color: '#374151' }}>
                        期間選択
                    </h2>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', maxWidth: '400px' }}>
                        <label>
                            開始日
                            <input 
                                type="date" 
                                value={dateRange.start} 
                                onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                                style={{
                                    width: '100%',
                                    padding: '0.5rem',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '0.375rem',
                                    fontSize: '0.875rem'
                                }}
                            />
                        </label>
                        
                        <label>
                            終了日
                            <input 
                                type="date" 
                                value={dateRange.end} 
                                onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                                style={{
                                    width: '100%',
                                    padding: '0.5rem',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '0.375rem',
                                    fontSize: '0.875rem'
                                }}
                            />
                        </label>
                    </div>
                </div>

                {/* 統計サマリー */}
                <div style={{ 
                    backgroundColor: '#ffffff', 
                    padding: '1.5rem', 
                    borderRadius: '0.5rem', 
                    border: '1px solid #e5e7eb',
                    marginBottom: '2rem'
                }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', color: '#374151' }}>
                        統計サマリー
                    </h2>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                        {metrics.map(metric => (
                            <div key={metric.value} style={{
                                padding: '1rem',
                                border: '1px solid #e5e7eb',
                                borderRadius: '0.5rem',
                                backgroundColor: '#f9fafb',
                                textAlign: 'center'
                            }}>
                                <h3 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#6b7280', marginBottom: '0.5rem' }}>
                                    {metric.label}
                                </h3>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', fontSize: '0.75rem' }}>
                                    <div>
                                        <div style={{ color: '#6b7280' }}>合計</div>
                                        <div style={{ fontWeight: '600', color: '#374151' }}>{calculateTotal(metric.value)}</div>
                                    </div>
                                    <div>
                                        <div style={{ color: '#6b7280' }}>平均</div>
                                        <div style={{ fontWeight: '600', color: '#374151' }}>{calculateAverage(metric.value)}</div>
                                    </div>
                                    <div>
                                        <div style={{ color: '#6b7280' }}>最大</div>
                                        <div style={{ fontWeight: '600', color: '#374151' }}>{calculateMax(metric.value)}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* チャート表示 */}
                <div style={{ 
                    backgroundColor: '#ffffff', 
                    padding: '1.5rem', 
                    borderRadius: '0.5rem', 
                    border: '1px solid #e5e7eb',
                    marginBottom: '2rem'
                }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', color: '#374151' }}>
                        グラフ表示
                    </h2>
                    
                    <div style={{ marginBottom: '1rem' }}>
                        <label>
                            表示する指標:
                            <select 
                                value={selectedMetric} 
                                onChange={(e) => setSelectedMetric(e.target.value)}
                                style={{
                                    marginLeft: '0.5rem',
                                    padding: '0.25rem 0.5rem',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '0.25rem',
                                    fontSize: '0.875rem'
                                }}
                            >
                                {metrics.map(metric => (
                                    <option key={metric.value} value={metric.value}>
                                        {metric.label}
                                    </option>
                                ))}
                            </select>
                        </label>
                    </div>
                    
                    {chartData.length > 0 ? (
                        <div style={{ height: '300px', position: 'relative' }}>
                            {/* シンプルな棒グラフ */}
                            <div style={{ 
                                display: 'flex', 
                                alignItems: 'end', 
                                height: '250px', 
                                gap: '4px',
                                padding: '1rem 0'
                            }}>
                                {chartData.map((item, index) => {
                                    const value = getMetricValue(item, selectedMetric);
                                    const maxValue = Math.max(...chartData.map(d => getMetricValue(d, selectedMetric)));
                                    const height = maxValue > 0 ? (value / maxValue) * 200 : 0;
                                    
                                    return (
                                        <div key={index} style={{ 
                                            display: 'flex', 
                                            flexDirection: 'column', 
                                            alignItems: 'center',
                                            flex: 1
                                        }}>
                                            <div style={{
                                                width: '100%',
                                                height: `${height}px`,
                                                backgroundColor: getMetricColor(selectedMetric),
                                                borderRadius: '2px 2px 0 0',
                                                minHeight: '4px'
                                            }} />
                                            <div style={{ 
                                                fontSize: '0.75rem', 
                                                color: '#6b7280', 
                                                marginTop: '0.5rem',
                                                transform: 'rotate(-45deg)',
                                                transformOrigin: 'top left'
                                            }}>
                                                {item.date}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        <p style={{color:'#6b7280', textAlign: 'center', padding: '2rem'}}>データがありません</p>
                    )}
                </div>

                {/* 詳細履歴テーブル */}
                <div style={{ 
                    backgroundColor: '#ffffff', 
                    padding: '1.5rem', 
                    borderRadius: '0.5rem', 
                    border: '1px solid #e5e7eb'
                }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', color: '#374151' }}>
                        詳細履歴
                    </h2>
                    
                    {loading ? (
                        <p style={{color:'#6b7280', textAlign: 'center', padding: '2rem'}}>読み込み中...</p>
                    ) : history.length === 0 ? (
                        <p style={{color:'#6b7280', textAlign: 'center', padding: '2rem'}}>履歴がありません</p>
                    ) : (
                        <div style={{overflowX: 'auto'}}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr>
                                        <th style={{textAlign:'left', borderBottom:'1px solid #ddd', padding: '0.75rem 0.5rem'}}>日付</th>
                                        <th style={{textAlign:'right', borderBottom:'1px solid #ddd', padding: '0.75rem 0.5rem'}}>架電</th>
                                        <th style={{textAlign:'right', borderBottom:'1px solid #ddd', padding: '0.75rem 0.5rem'}}>接続</th>
                                        <th style={{textAlign:'right', borderBottom:'1px solid #ddd', padding: '0.75rem 0.5rem'}}>資料</th>
                                        <th style={{textAlign:'right', borderBottom:'1px solid #ddd', padding: '0.75rem 0.5rem'}}>アポ</th>
                                        <th style={{textAlign:'left', borderBottom:'1px solid #ddd', padding: '0.75rem 0.5rem'}}>登録日時</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {history.map(r =>
                                        <tr key={r.id}>
                                            <td style={{padding: '0.75rem 0.5rem'}}>{r.report_date}</td>
                                            <td style={{padding: '0.75rem 0.5rem', textAlign:'right'}}>{r.calls}</td>
                                            <td style={{padding: '0.75rem 0.5rem', textAlign:'right'}}>{r.connects}</td>
                                            <td style={{padding: '0.75rem 0.5rem', textAlign:'right'}}>{r.docs_sent}</td>
                                            <td style={{padding: '0.75rem 0.5rem', textAlign:'right'}}>{r.apointments}</td>
                                            <td style={{padding: '0.75rem 0.5rem', fontSize: '0.875rem', color: '#6b7280'}}>
                                                {new Date(r.created_at).toLocaleString('ja-JP')}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
    )
}
