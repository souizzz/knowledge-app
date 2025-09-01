#!/usr/bin/env node

/**
 * メールテンプレート設定スクリプト
 * 
 * このスクリプトは、Supabaseのメールテンプレートを
 * 日本語対応の美しいデザインに更新します。
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// 環境変数の確認
const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY'
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`❌ 環境変数 ${envVar} が設定されていません`);
    process.exit(1);
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Supabaseクライアントの作成
const supabase = createClient(supabaseUrl, supabaseKey);

// メールテンプレートの定義
const emailTemplates = {
  magicLink: {
    subject: '🔐 ログインリンク - Knowledge App',
    html: `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>ログインリンク</title>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            margin: 0; 
            padding: 0; 
            background-color: #f8fafc;
        }
        .container { 
            max-width: 600px; 
            margin: 0 auto; 
            padding: 20px; 
            background-color: white;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header { 
            background: linear-gradient(135deg, #3b82f6, #1d4ed8); 
            color: white; 
            padding: 30px 20px; 
            text-align: center; 
            border-radius: 8px 8px 0 0;
        }
        .header h1 { 
            margin: 0; 
            font-size: 24px; 
            font-weight: 600;
        }
        .content { 
            padding: 30px 20px; 
            background: #f9fafb; 
        }
        .content h2 { 
            color: #1f2937; 
            margin-top: 0; 
            font-size: 20px;
        }
        .button { 
            display: inline-block; 
            background: linear-gradient(135deg, #3b82f6, #1d4ed8); 
            color: white; 
            padding: 14px 28px; 
            text-decoration: none; 
            border-radius: 8px; 
            margin: 20px 0; 
            font-weight: 600;
            font-size: 16px;
            transition: all 0.2s ease;
        }
        .button:hover { 
            transform: translateY(-2px); 
            box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
        }
        .info-box { 
            background: #eff6ff; 
            border: 1px solid #bfdbfe; 
            border-radius: 6px; 
            padding: 16px; 
            margin: 20px 0; 
        }
        .info-box h3 { 
            margin: 0 0 8px 0; 
            color: #1e40af; 
            font-size: 16px;
        }
        .info-box ul { 
            margin: 0; 
            padding-left: 20px; 
        }
        .info-box li { 
            margin: 4px 0; 
            color: #374151;
        }
        .footer { 
            padding: 20px; 
            text-align: center; 
            color: #6b7280; 
            font-size: 14px; 
            border-top: 1px solid #e5e7eb;
        }
        .footer p { 
            margin: 4px 0; 
        }
        @media only screen and (max-width: 600px) {
            .container { 
                width: 100% !important; 
                padding: 10px !important; 
                margin: 0 !important;
                border-radius: 0 !important;
            }
            .header h1 { 
                font-size: 20px !important; 
            }
            .button { 
                display: block !important; 
                width: 100% !important; 
                text-align: center !important; 
                box-sizing: border-box !important;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔐 ログインリンク</h1>
        </div>
        <div class="content">
            <h2>こんにちは！</h2>
            <p>Knowledge Appにログインするためのリンクをお送りします。</p>
            <p style="text-align: center;">
                <a href="{{ .ConfirmationURL }}" class="button">ログインする</a>
            </p>
            
            <div class="info-box">
                <h3>⚠️ 重要事項</h3>
                <ul>
                    <li>このリンクは24時間有効です</li>
                    <li>このリンクは一度だけ使用できます</li>
                    <li>心当たりのない場合は、このメールを無視してください</li>
                    <li>セキュリティのため、リンクは共有しないでください</li>
                </ul>
            </div>
            
            <p>ログインに問題がある場合は、サポートチームまでお問い合わせください。</p>
        </div>
        <div class="footer">
            <p>このメールは自動送信されています。返信はできません。</p>
            <p>© 2024 Knowledge App. All rights reserved.</p>
            <p>Knowledge App - チームの知識を共有・活用するプラットフォーム</p>
        </div>
    </div>
</body>
</html>`
  },
  
  invite: {
    subject: '🎉 招待メール - Knowledge App',
    html: `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>招待メール</title>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            margin: 0; 
            padding: 0; 
            background-color: #f8fafc;
        }
        .container { 
            max-width: 600px; 
            margin: 0 auto; 
            padding: 20px; 
            background-color: white;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header { 
            background: linear-gradient(135deg, #10b981, #059669); 
            color: white; 
            padding: 30px 20px; 
            text-align: center; 
            border-radius: 8px 8px 0 0;
        }
        .header h1 { 
            margin: 0; 
            font-size: 24px; 
            font-weight: 600;
        }
        .content { 
            padding: 30px 20px; 
            background: #f9fafb; 
        }
        .content h2 { 
            color: #1f2937; 
            margin-top: 0; 
            font-size: 20px;
        }
        .button { 
            display: inline-block; 
            background: linear-gradient(135deg, #10b981, #059669); 
            color: white; 
            padding: 14px 28px; 
            text-decoration: none; 
            border-radius: 8px; 
            margin: 20px 0; 
            font-weight: 600;
            font-size: 16px;
            transition: all 0.2s ease;
        }
        .button:hover { 
            transform: translateY(-2px); 
            box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
        }
        .invite-details { 
            background: #ecfdf5; 
            border: 1px solid #a7f3d0; 
            border-radius: 6px; 
            padding: 16px; 
            margin: 20px 0; 
        }
        .invite-details h3 { 
            margin: 0 0 12px 0; 
            color: #065f46; 
            font-size: 16px;
        }
        .detail-row { 
            display: flex; 
            justify-content: space-between; 
            margin: 8px 0; 
            padding: 4px 0;
        }
        .detail-label { 
            font-weight: 600; 
            color: #374151;
        }
        .detail-value { 
            color: #1f2937;
        }
        .footer { 
            padding: 20px; 
            text-align: center; 
            color: #6b7280; 
            font-size: 14px; 
            border-top: 1px solid #e5e7eb;
        }
        .footer p { 
            margin: 4px 0; 
        }
        @media only screen and (max-width: 600px) {
            .container { 
                width: 100% !important; 
                padding: 10px !important; 
                margin: 0 !important;
                border-radius: 0 !important;
            }
            .header h1 { 
                font-size: 20px !important; 
            }
            .button { 
                display: block !important; 
                width: 100% !important; 
                text-align: center !important; 
                box-sizing: border-box !important;
            }
            .detail-row { 
                flex-direction: column; 
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎉 招待メール</h1>
        </div>
        <div class="content">
            <h2>こんにちは！</h2>
            <p>{{ .InviterName }} さんからKnowledge Appへの招待を受けました。</p>
            <p>以下のボタンをクリックして参加してください：</p>
            <p style="text-align: center;">
                <a href="{{ .ConfirmationURL }}" class="button">参加する</a>
            </p>
            
            <div class="invite-details">
                <h3>📋 招待の詳細</h3>
                <div class="detail-row">
                    <span class="detail-label">組織名:</span>
                    <span class="detail-value">{{ .OrganizationName }}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">招待者:</span>
                    <span class="detail-value">{{ .InviterName }}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">有効期限:</span>
                    <span class="detail-value">7日間</span>
                </div>
            </div>
            
            <p>Knowledge Appでは、チームの知識を効率的に共有・活用できます。</p>
        </div>
        <div class="footer">
            <p>このメールは自動送信されています。返信はできません。</p>
            <p>© 2024 Knowledge App. All rights reserved.</p>
            <p>Knowledge App - チームの知識を共有・活用するプラットフォーム</p>
        </div>
    </div>
</body>
</html>`
  }
};

async function setupEmailTemplates() {
  console.log('📧 メールテンプレートの設定を開始します...\n');

  try {
    // 注意: Supabaseのメールテンプレートは直接APIで更新できないため、
    // 手動設定の手順を表示します
    
    console.log('ℹ️  Supabaseのメールテンプレートは、ダッシュボードから手動で設定する必要があります。\n');
    
    console.log('📋 設定手順:');
    console.log('1. Supabaseダッシュボードにログイン');
    console.log('2. Authentication → Email Templates に移動');
    console.log('3. 各テンプレートを以下の内容で更新\n');

    // Magic Link テンプレート
    console.log('🔐 Magic Link テンプレート:');
    console.log('Subject:', emailTemplates.magicLink.subject);
    console.log('HTML:', emailTemplates.magicLink.html);
    console.log('\n' + '='.repeat(80) + '\n');

    // Invite テンプレート
    console.log('🎉 Invite テンプレート:');
    console.log('Subject:', emailTemplates.invite.subject);
    console.log('HTML:', emailTemplates.invite.html);

    // テンプレートファイルの保存
    const fs = require('fs');
    const path = require('path');
    
    const templatesDir = path.join(__dirname, '..', 'email-templates');
    if (!fs.existsSync(templatesDir)) {
      fs.mkdirSync(templatesDir, { recursive: true });
    }

    // Magic Link テンプレートを保存
    fs.writeFileSync(
      path.join(templatesDir, 'magic-link.html'),
      emailTemplates.magicLink.html
    );
    
    // Invite テンプレートを保存
    fs.writeFileSync(
      path.join(templatesDir, 'invite.html'),
      emailTemplates.invite.html
    );

    console.log('\n✅ テンプレートファイルが保存されました:');
    console.log(`   ${path.join(templatesDir, 'magic-link.html')}`);
    console.log(`   ${path.join(templatesDir, 'invite.html')}`);

    console.log('\n🎉 メールテンプレートの設定が完了しました！');
    console.log('\n📋 次のステップ:');
    console.log('1. 上記のテンプレートをSupabaseダッシュボードにコピー&ペースト');
    console.log('2. テンプレートのプレビューで確認');
    console.log('3. テストメールで動作確認');

  } catch (error) {
    console.error('❌ 設定中にエラーが発生しました:', error.message);
    process.exit(1);
  }
}

// スクリプトの実行
if (require.main === module) {
  setupEmailTemplates();
}

module.exports = { setupEmailTemplates, emailTemplates };
