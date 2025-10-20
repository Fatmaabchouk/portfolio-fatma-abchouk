import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// 🌐 Supabase Setup
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

// 🔍 Detect language of user message
function detectLanguage(message: string): string {
  const arabicPattern = /[\u0600-\u06FF]/;
  const lowerMessage = message.toLowerCase().trim().replace(/[!.?،؟]/g, '');
  
  // Check for Arabic characters first
  if (arabicPattern.test(message)) {
    return 'arabic';
  }
  
  // English greetings and keywords
  const englishWords = ['hello', 'hi', 'hey', 'good morning', 'good evening', 'what', 'who', 'where', 'when', 'why', 'how', 'skills', 'project', 'experience', 'education', 'work', 'about', 'tell me'];
  
  // French greetings and keywords
  const frenchWords = ['bonjour', 'salut', 'bonsoir', 'bjr', 'slt', 'coucou', 'cc', 'bsr', 'comment', 'quoi', 'qui', 'où', 'quand', 'pourquoi', 'compétences', 'projet', 'expérience', 'formation', 'travail', 'parle'];
  
  // Check for English match
  if (englishWords.some(kw => lowerMessage.includes(kw))) {
    return 'english';
  }
  
  // Check for French match
  if (frenchWords.some(kw => lowerMessage.includes(kw))) {
    return 'french';
  }
  
  // Default to English if unsure
  return 'english';
}

// 📚 Get Portfolio Context from Database
async function getPortfolioContext(detectedLang: string) {
  try {
    console.log("🔍 Fetching portfolio data from database...");
    console.log(`🌍 Detected language: ${detectedLang}`);
    
    const { data, error } = await supabase
      .from('portfolio_data')
      .select('section, content')
      .order('section');
    
    if (error) {
      console.error('❌ Database error:', error);
      return getDefaultContext(detectedLang);
    }
    
    if (!data || data.length === 0) {
      console.warn('⚠️ No portfolio data found in database');
      return getDefaultContext(detectedLang);
    }
    
    console.log(`✅ Loaded ${data.length} sections from database`);
    
    // Build personalized context from database
    let context = '';
    
    // Language-specific instructions
    if (detectedLang === 'arabic') {
      context = `أنت المساعد الافتراضي الذكي لفاطمة عبشوق. إليك معلومات محفظتها الكاملة:\n\n`;
    } else if (detectedLang === 'english') {
      context = `You are Fatma Abchouk's intelligent virtual assistant. Here is her complete portfolio:\n\n`;
    } else {
      context = `Tu es l'assistant virtuel intelligent de Fatma Abchouk. Voici son portfolio complet:\n\n`;
    }
    
    data.forEach(row => {
      const sectionTitle = row.section.charAt(0).toUpperCase() + row.section.slice(1);
      context += `## ${sectionTitle}\n${row.content}\n\n`;
    });
    
    // Add language-specific instructions
    context += getLanguageInstructions(detectedLang);
    
    return context;
    
  } catch (err) {
    console.error('💥 Error in getPortfolioContext:', err);
    return getDefaultContext(detectedLang);
  }
}

// 📝 Get language-specific instructions
function getLanguageInstructions(lang: string): string {
  const contactInfo = `
📧 Contact Info:
Email: fatmaabchouk18@gmail.com
LinkedIn: linkedin.com/in/fatma-abchouk-b49753253
GitHub: github.com/Fatmaabchouk`;

  if (lang === 'arabic') {
    return `
📋 تعليمات مهمة جداً:

🌍 اللغة:
- يجب عليك الرد بالعربية فقط
- استخدم لهجة مهنية ودافئة
- لا تستخدم أي لغة أخرى في الإجابة

✨ أسلوب الرد:
- كن موجزاً ومباشراً (2-3 جمل قصيرة كحد أقصى)
- أعط ملخصاً سريعاً وليس كل التفاصيل
- للشهادات: اذكر الاسم فقط
- للمشاريع: اذكر 1-2 أمثلة كحد أقصى

📧 معلومات التواصل (إضافتها في النهاية):
${contactInfo}

❌ تجنب:
- الفقرات الطويلة
- القوائم الطويلة
- التكرار

💡 مثال على إجابة جيدة:
"فاطمة تجيد تطوير Full Stack باستخدام React و Node.js و MongoDB. طورت عدة مشاريع منها موقع للتجارة الإلكترونية مع Stripe. حاصلة على شهادات IBM Python و KNIME Analytics.

${contactInfo}"`;
  } else if (lang === 'english') {
    return `
📋 CRITICAL INSTRUCTIONS:

🌍 LANGUAGE:
- You MUST respond in English only
- Use a professional yet warm tone
- Do NOT use any other language in your response

✨ RESPONSE STYLE:
- Be CONCISE and DIRECT (max 2-3 short sentences)
- Give a quick SUMMARY, not all details
- For certifications: mention NAME only
- For projects: cite 1-2 examples max

📧 CONTACT INFO (add at the end):
${contactInfo}

❌ AVOID:
- Long paragraphs
- Long lists
- Repetitions

💡 GOOD RESPONSE EXAMPLE:
"Fatma masters Full Stack development with React, Node.js, MongoDB and Express. She developed several projects including an e-commerce site with Stripe payment. Certified in IBM Python and KNIME Analytics.

${contactInfo}"`;
  } else {
    return `
📋 Instructions CRITIQUES:

🌍 LANGUE:
- Tu DOIS répondre en français uniquement
- Utilise un ton professionnel mais chaleureux
- N'utilise AUCUNE autre langue dans ta réponse

✨ STYLE DE RÉPONSE:
- Sois CONCIS et DIRECT (maximum 2-3 phrases courtes)
- Donne un RÉSUMÉ rapide, pas tous les détails
- Pour les certifications: mentionne juste le NOM
- Pour les projets: cite 1-2 exemples max

📧 CONTACT (ajouter à la fin):
${contactInfo}

❌ À ÉVITER:
- Longs paragraphes
- Listes longues
- Répétitions

💡 EXEMPLE BONNE RÉPONSE:
"Fatma maîtrise le Full Stack avec React, Node.js, MongoDB et Express. Elle a développé plusieurs projets dont un site e-commerce avec paiement Stripe. Certifiée IBM Python et KNIME Analytics.

${contactInfo}"`;
  }
}

// 🔄 Fallback Context
function getDefaultContext(lang: string) {
  console.warn("⚠️ Using default fallback context");
  
  const content = `
## About Fatma
Fatma Abchouk - Master in Professional Data Science (ISAE Gafsa, 2024-present) + Bachelor in Management Information Systems (2024). 3+ years freelance experience in web development and data projects.

## Skills
DATA SCIENCE & AI: Machine Learning, Deep Learning, NLP, Generative AI, Python
FULL STACK: React.js, Node.js, Express, MongoDB, MySQL, TypeScript
DATA ENGINEERING: KNIME Analytics, ETL, Power BI
UI/UX: Figma, Prototyping

## Certifications
- IBM Python for Data Science & AI
- KNIME Analytics Platform Certified

## Experience
- 3+ years freelance (web dev & data)
- Brainwave Matrix internship: TechHive blog, cosmetics e-commerce
- Projects: CRM system, Koffa platform, AI chatbot

## Technologies
React, Node.js, Python, MongoDB, MySQL, Express, Stripe, Power BI, KNIME`;

  return content + '\n\n' + getLanguageInstructions(lang);
}

// 🤖 Call Gemini API
async function callGemini(context: string, userMessage: string, detectedLang: string) {
  const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
  
  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY non configurée");
  }
  
  // Create language-specific prompt
  let prompt = '';
  if (detectedLang === 'arabic') {
    prompt = `${context}\n\n💬 سؤال المستخدم: "${userMessage}"\n\n✍️ إجابتك (بالعربية فقط، موجزة ومهنية):`;
  } else if (detectedLang === 'english') {
    prompt = `${context}\n\n💬 User question: "${userMessage}"\n\n✍️ Your answer (in English only, concise and professional):`;
  } else {
    prompt = `${context}\n\n💬 Question de l'utilisateur: "${userMessage}"\n\n✍️ Ta réponse (en français uniquement, concise et professionnelle):`;
  }
  
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 500,
          topP: 0.9,
        },
        safetySettings: [
          { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
          { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" }
        ]
      })
    }
  );
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error("❌ Gemini API Error:", errorText);
    throw new Error(`Gemini API failed: ${response.status}`);
  }
  
  const data = await response.json();
  const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  
  if (!reply) {
    throw new Error("Aucune réponse valide de Gemini API");
  }
  
  return reply.trim();
}

// 🧠 Main Edge Function
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  
  // Test endpoint
  const url = new URL(req.url);
  if (url.pathname.includes('/test-db')) {
    try {
      const { data, error } = await supabase
        .from('portfolio_data')
        .select('section, content')
        .limit(5);
      
      return new Response(
        JSON.stringify({ 
          success: !error,
          data: data,
          error: error,
          message: error ? "Database connection failed" : "Database connection successful"
        }), 
        { 
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    } catch (err) {
      return new Response(
        JSON.stringify({ success: false, error: err.message }), 
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  }
  
  try {
    const { message } = await req.json();
    console.log("📩 Message reçu:", message);
    
    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "Le message ne peut pas être vide" }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }
    
    // Detect language
    const detectedLang = detectLanguage(message);
    console.log(`🌍 Language detected: ${detectedLang}`);
    
    // Load portfolio context with language
    const portfolioContext = await getPortfolioContext(detectedLang);
    
    // Call Gemini API
    const reply = await callGemini(portfolioContext, message, detectedLang);
    
    console.log("✅ Réponse générée avec succès");
    
    return new Response(
      JSON.stringify({ reply }), 
      { 
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
    
  } catch (err) {
    console.error("💥 Erreur:", err);
    
    return new Response(
      JSON.stringify({ 
        error: "Désolé, une erreur s'est produite. Veuillez réessayer.",
        details: err instanceof Error ? err.message : "Unknown error"
      }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});