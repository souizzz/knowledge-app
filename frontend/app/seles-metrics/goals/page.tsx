'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'

type Goal = {
    id: number;
    user_id: string;
    goal_type: string;
    target_value: number;
    current_value: number;
    start_date: string;
    end_date: string;
    created_at: string;
}

export default function GoalsPage() {
    const [goals, setGoals] = useState<Goal[]>([])
    const [loading, setLoading] = useState(false)
    const [me, setMe] = useState<string | null>(null)
    const [newGoal, setNewGoal] = useState({
        goal_type: 'calls',
        target_value: 0,
        start_date: new Date().toISOString().slice(0, 10),
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
    })

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

    // 目標データを取得
    useEffect(() => {
        if (!me) return;
        
        const fetchGoals = async () => {
            const { data, error } = await supabase
                .from('sales_goals')
                .select('*')
                .eq('user_id', me)
                .order('created_at', { ascending: false });
            
            if (error) {
                console.warn('目標データの取得に失敗:', error.message);
                setGoals([]);
                return;
            }
            
            setGoals(data || []);
        };
        
        fetchGoals();
    }, [me]);

    const goalTypes = [
        { value: 'calls', label: '架電数' },
        { value: 'connects', label: '担当者接続数' },
        { value: 'docs_sent', label: '資料送付数' },
        { value: 'apointments', label: 'アポ数' }
    ];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!me) return;
        
        setLoading(true);
        
        const { error } = await supabase
            .from('sales_goals')
            .insert({
                user_id: me,
                goal_type: newGoal.goal_type,
                target_value: newGoal.target_value,
                current_value: 0,
                start_date: newGoal.start_date,
                end_date: newGoal.end_date
            });
        
        if (error) {
            console.error('目標の保存に失敗:', error.message);
            alert('目標の保存に失敗しました');
        } else {
            // フォームをリセット
            setNewGoal({
                goal_type: 'calls',
                target_value: 0,
                start_date: new Date().toISOString().slice(0, 10),
                end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
            });
            
            // 目標リストを再取得
            const { data } = await supabase
                .from('sales_goals')
                .select('*')
                .eq('user_id', me)
                .order('created_at', { ascending: false });
            
            setGoals(data || []);
        }
        
        setLoading(false);
    };

    const getGoalTypeLabel = (type: string) => {
        return goalTypes.find(gt => gt.value === type)?.label || type;
    };

    const calculateProgress = (current: number, target: number) => {
        if (target === 0) return 0;
        return Math.min((current / target) * 100, 100);
    };

    return (
        <div>
                <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1.5rem', color: '#1f2937' }}>
                    目標管理
                </h1>
                
                {/* 新規目標作成フォーム */}
                <div style={{ 
                    backgroundColor: '#ffffff', 
                    padding: '1.5rem', 
                    borderRadius: '0.5rem', 
                    border: '1px solid #e5e7eb',
                    marginBottom: '2rem'
                }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', color: '#374151' }}>
                        新規目標を作成
                    </h2>
                    
                    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <label>
                                目標タイプ
                                <select 
                                    value={newGoal.goal_type} 
                                    onChange={(e) => setNewGoal({...newGoal, goal_type: e.target.value})}
                                    style={{
                                        width: '100%',
                                        padding: '0.5rem',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '0.375rem',
                                        fontSize: '0.875rem'
                                    }}
                                >
                                    {goalTypes.map(type => (
                                        <option key={type.value} value={type.value}>
                                            {type.label}
                                        </option>
                                    ))}
                                </select>
                            </label>
                            
                            <label>
                                目標値
                                <input 
                                    type="number" 
                                    value={newGoal.target_value} 
                                    onChange={(e) => setNewGoal({...newGoal, target_value: Number(e.target.value)})}
                                    min="1"
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
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <label>
                                開始日
                                <input 
                                    type="date" 
                                    value={newGoal.start_date} 
                                    onChange={(e) => setNewGoal({...newGoal, start_date: e.target.value})}
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
                                    value={newGoal.end_date} 
                                    onChange={(e) => setNewGoal({...newGoal, end_date: e.target.value})}
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
                        
                        <button 
                            type="submit" 
                            disabled={loading || !me}
                            style={{
                                padding: '0.75rem 1.5rem',
                                backgroundColor: '#3b82f6',
                                color: 'white',
                                border: 'none',
                                borderRadius: '0.375rem',
                                fontSize: '0.875rem',
                                fontWeight: '500',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                opacity: loading ? 0.6 : 1
                            }}
                        >
                            {loading ? '作成中...' : '目標を作成'}
                        </button>
                        
                        {!me && <p style={{color:'#6b7280', fontSize: '0.875rem'}}>※ ログイン後に入力できます。</p>}
                    </form>
                </div>

                {/* 目標一覧 */}
                <div style={{ 
                    backgroundColor: '#ffffff', 
                    padding: '1.5rem', 
                    borderRadius: '0.5rem', 
                    border: '1px solid #e5e7eb'
                }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', color: '#374151' }}>
                        現在の目標
                    </h2>
                    
                    {goals.length === 0 ? (
                        <p style={{color:'#6b7280', textAlign: 'center', padding: '2rem'}}>目標が設定されていません</p>
                    ) : (
                        <div style={{ display: 'grid', gap: '1rem' }}>
                            {goals.map(goal => (
                                <div key={goal.id} style={{
                                    padding: '1rem',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '0.5rem',
                                    backgroundColor: '#f9fafb'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                        <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#374151' }}>
                                            {getGoalTypeLabel(goal.goal_type)}
                                        </h3>
                                        <span style={{ 
                                            fontSize: '0.875rem', 
                                            color: '#6b7280' 
                                        }}>
                                            {goal.start_date} 〜 {goal.end_date}
                                        </span>
                                    </div>
                                    
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                        <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                                            進捗: {goal.current_value} / {goal.target_value}
                                        </span>
                                        <span style={{ 
                                            fontSize: '0.875rem', 
                                            fontWeight: '600',
                                            color: calculateProgress(goal.current_value, goal.target_value) >= 100 ? '#059669' : '#3b82f6'
                                        }}>
                                            {calculateProgress(goal.current_value, goal.target_value).toFixed(1)}%
                                        </span>
                                    </div>
                                    
                                    <div style={{
                                        width: '100%',
                                        height: '8px',
                                        backgroundColor: '#e5e7eb',
                                        borderRadius: '4px',
                                        overflow: 'hidden'
                                    }}>
                                        <div style={{
                                            width: `${calculateProgress(goal.current_value, goal.target_value)}%`,
                                            height: '100%',
                                            backgroundColor: calculateProgress(goal.current_value, goal.target_value) >= 100 ? '#10b981' : '#3b82f6',
                                            transition: 'width 0.3s ease'
                                        }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
    )
}
