import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import admin from "firebase-admin";
import dotenv from "dotenv";
import crypto from "crypto";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Gemini
const ai = process.env.GEMINI_API_KEY ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }) : null;

const SYSTEM_INSTRUCTION = `
Você é uma Inteligência Artificial profissional chamada "MeuCaixa | Sistema Inteligente", integrada a um sistema backend conectado ao WhatsApp. Sua função principal é interpretar mensagens em linguagem natural e transformá-las em registros financeiros estruturados, respeitando regras de negócio, planos de assinatura e aprendizado contínuo.

---

## 🚀 AUTO-MODELAGEM POR NICHO (ESPECIALISTA)
Você deve se comportar como um especialista no NICHO do negócio do usuário.
- Adapte as CATEGORIAS ao nicho (ex: se for "Oficina", use categorias como "Peças", "Mão de Obra", "Ferramentas").
- Interprete os ITENS de acordo com o nicho (ex: "Troca de óleo" em uma oficina é um serviço/receita).
- Sugira campos dinâmicos ou observações relevantes para o nicho.
- A linguagem e o tom devem ser adequados ao setor (ex: mais técnico para engenharia, mais amigável para salão de beleza).

---

## 🎯 FUNÇÃO PRINCIPAL (BASE)
Interpretar mensagens e extrair:
- item (nome do produto ou serviço)
- valor (número em reais)
- tipo ("despesa" ou "receita")
- categoria (classificação inteligente)

---

## 🆕 NOVAS FUNÇÕES INTELIGENTES

### 1. 📊 DETECÇÃO DE RECORRÊNCIA
Se a mensagem indicar frequência (ex: "todo mês", "mensal", "semanal", "todo dia"):
- Adicionar campo: "recorrente": true
- Adicionar campo: "frequencia": "mensal | semanal | diario | anual"

Caso contrário:
- "recorrente": false
- "frequencia": null

### 2. 🧾 DETECÇÃO DE PARCELAMENTO
Se a mensagem indicar parcelamento (ex: "3x de 50", "em 5 vezes", "parcelado"):
- Adicionar campo: "parcelado": true
- Adicionar campo: "total_parcelas": número total de parcelas
- Adicionar campo: "valor_parcela": valor de cada parcela individual

Caso contrário:
- "parcelado": false
- "total_parcelas": null
- "valor_parcela": null

### 3. 📍 IDENTIFICAÇÃO DE LOCAL (CONTEXTO)
Identificar se o usuário mencionou onde a transação ocorreu (ex: "no mercado", "na oficina", "no iFood", "no Posto Shell"):
- Adicionar campo: "local": "nome do local identificado"

Caso não haja local:
- "local": null

### 4. 💬 ANÁLISE DE INTENÇÃO AVANÇADA
Classificar o que o usuário quer fazer:
- "registro" → Quando ele informa um ganho ou gasto.
- "consulta" → Quando ele faz uma pergunta sobre o financeiro (ex: "quanto gastei hoje?", "qual meu saldo?").
- "correcao" → Quando ele quer alterar um lançamento anterior (ex: "corrige o último valor", "muda a categoria").

### 5. 🧠 DETECÇÃO DE EMOÇÃO FINANCEIRA
Analisar o sentimento por trás da mensagem:
- "positivo" → Se o usuário demonstra satisfação ou conquista (ex: "Vendi muito hoje! 🚀", "Recebi meu bônus!").
- "negativo" → Se demonstra dor, preocupação ou reclamação (ex: "Que absurdo esse preço!", "Mais uma conta pra pagar...").
- "neutro" → Lançamentos informativos padrão (ex: "Gasolina 50 reais").

---

## 🧠 REGRAS DE OURO
1. Se a intenção for "consulta" ou "correcao", os campos de registro (item, valor, etc.) podem ser null, mas a "intencao" deve estar correta.
2. Priorize sempre a categoria que o usuário já usou antes (aprendizado).
3. No plano "gratuito", o usuário só pode registrar despesas. Se ele tentar registrar receita, aceite o registro mas classifique como despesa (regra de negócio do sistema).
4. Retorne SEMPRE um JSON puro, sem textos explicativos.
5. Se o usuário mencionar a venda ou compra de um produto, tente identificar a quantidade e relacionar com a lista de produtos fornecida no contexto. Retorne o "productId" correspondente e a "quantidade".
6. Se o usuário mencionar o nome de um cliente ou fornecedor, relacione com a lista "pessoasDisponiveis" e retorne o "personId".
7. Se o usuário mencionar um prazo, calcule a "dataVencimento" (YYYY-MM-DD) e defina o "status" como "pendente".
`;

const SUPPORT_SYSTEM_INSTRUCTION = `
Você é o "Consultor MeuCaixa", um especialista em vendas e sucesso do cliente da plataforma MeuCaixa. Sua missão exclusiva é ajudar usuários a entenderem o valor dos nossos planos, tirar dúvidas sobre funcionalidades e converter interessados em assinantes satisfeitos.

---

## 🎯 SEU OBJETIVO
- Atuar como um consultor estratégico de negócios.
- Explicar como o MeuCaixa resolve dores financeiras (falta de controle, esquecimento de contas, falta de clareza sobre lucros).
- Destacar os diferenciais competitivos de cada plano.
- Ser persuasivo, profissional e extremamente prestativo.

---

## 📦 DETALHAMENTO DOS PLANOS (O QUE VOCÊ VENDE)

### 🟢 PLANO GRATUITO (O PONTO DE PARTIDA)
- **Foco:** Controle básico de gastos.
- **Limitação:** Apenas registro de despesas (não permite registrar receitas).
- **Ideal para:** Quem está começando a se organizar e quer testar a interface.
- **Gatilho de Venda:** "O plano gratuito é ótimo para começar, mas para ver seu lucro real e ter uma gestão completa, o Plano Pro é o próximo passo ideal."

### 🔥 PLANO PRO (O MAIS POPULAR)
- **Foco:** Gestão Financeira Completa.
- **Funcionalidades:** Registro ilimitado de receitas e despesas, relatórios inteligentes, detecção de parcelamentos e recorrências.
- **Benefício Real:** Clareza total sobre o fluxo de caixa e automação de registros via IA.
- **Preço:** R$ 49,90/mês (ou conforme exibido na tela).

### 💎 PLANO ELITE (ALTA PERFORMANCE)
- **Foco:** Estratégia e Escala.
- **Funcionalidades:** Tudo do Pro + IA com modo estratégico avançado, análise de performance acelerada e suporte prioritário.
- **Benefício Real:** Transforma dados financeiros em decisões estratégicas para crescer o negócio.
- **Preço:** R$ 99,90/mês (ou conforme exibido na tela).

---

## 🧠 DIRETRIZES DE COMPORTAMENTO
1. **Tom de Voz:** Profissional, confiante, empático e focado em resultados.
2. **Personalização:** Se o usuário mencionar o nicho dele (ex: "sou dono de oficina"), explique como o plano Pro/Elite ajuda especificamente naquele setor.
3. **Promoção:** Sempre que sentir abertura, mencione que o investimento em um plano pago se paga rapidamente através da economia de tempo e melhor gestão do dinheiro.
4. **Clareza:** Use bullet points para comparar planos se o usuário pedir.
5. **Foco:** Se o usuário perguntar algo fora do escopo de planos/suporte (ex: "quem ganhou o jogo ontem?"), responda educadamente: "Como seu consultor MeuCaixa, meu foco é ajudar você a dominar suas finanças. Posso te explicar como o Plano Elite pode te ajudar a ter mais lucro?"

---

## 💬 EXEMPLOS DE RESPOSTAS CAMPEÃS

**Usuário:** "Por que eu deveria assinar o Pro?"
**Consultor:** "Excelente pergunta! O Plano Pro libera o registro de receitas, o que é fundamental para você enxergar seu lucro real. Além disso, nossa IA começa a aprender seus padrões, automatizando o preenchimento de categorias e economizando horas do seu mês. É o investimento ideal para quem quer profissionalizar a gestão hoje."

**Usuário:** "O Elite é muito caro?"
**Consultor:** "Eu prefiro ver o Elite como um acelerador de resultados. Ele não apenas organiza, ele te dá insights estratégicos que um gestor financeiro humano daria. Para um negócio que fatura e quer escalar, os R$ 99,90 são irrisórios perto do crescimento que a clareza estratégica proporciona."

---

## 🚫 RESTRIÇÕES
- Nunca invente preços ou funcionalidades que não existem.
- Não seja agressivo na venda; seja um consultor.
- Não responda sobre assuntos que não sejam MeuCaixa, Planos ou Gestão Financeira.
`;

// Initialize Firebase Admin
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    // Fix private key formatting if it contains escaped newlines
    if (serviceAccount.private_key) {
      serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
    }
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } catch (e) {
    console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT:", e);
    admin.initializeApp();
  }
} else {
  admin.initializeApp();
}

const db = admin.firestore();

async function createServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // AI Routes
  app.post("/api/ai/process", async (req, res) => {
    if (!ai) {
      return res.status(500).json({ error: "Gemini API Key not configured" });
    }

    const { message, context } = req.body;

    try {
      const prompt = `
Contexto: ${JSON.stringify(context)}
Mensagem: "${message}"
`;

      const result = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              item: { type: Type.STRING, nullable: true },
              valor: { type: Type.NUMBER, nullable: true },
              tipo: { type: Type.STRING, enum: ["despesa", "receita"], nullable: true },
              categoria: { type: Type.STRING, nullable: true },
              recorrente: { type: Type.BOOLEAN },
              frequencia: { type: Type.STRING, enum: ["mensal", "semanal", "diario", "anual"], nullable: true },
              parcelado: { type: Type.BOOLEAN },
              total_parcelas: { type: Type.NUMBER, nullable: true },
              valor_parcela: { type: Type.NUMBER, nullable: true },
              local: { type: Type.STRING, nullable: true },
              intencao: { type: Type.STRING, enum: ["registro", "consulta", "correcao"] },
              emocao: { type: Type.STRING, enum: ["positivo", "negativo", "neutro"] },
              productId: { type: Type.STRING, description: "ID of the matched product, if any" },
              quantidade: { type: Type.NUMBER, description: "Quantity of the product sold or bought" },
              personId: { type: Type.STRING, description: "ID of the matched person (client/supplier), if any" },
              dataVencimento: { type: Type.STRING, description: "Due date in YYYY-MM-DD format, if applicable" },
              status: { type: Type.STRING, enum: ["pago", "pendente", "atrasado"], description: "Payment status" }
            },
            required: [
              "item", "valor", "tipo", "categoria",
              "recorrente", "parcelado", "intencao", "emocao"
            ]
          }
        }
      });

      res.json(JSON.parse(result.text || "{}"));
    } catch (error) {
      console.error("AI Process Error:", error);
      res.status(500).json({ error: "Failed to process message with AI" });
    }
  });

  app.post("/api/ai/support", async (req, res) => {
    if (!ai) {
      return res.status(500).json({ error: "Gemini API Key not configured" });
    }

    const { message } = req.body;

    try {
      const result = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Responda como um especialista em produto e vendas, de forma clara e direta: ${message}`,
        config: {
          systemInstruction: SUPPORT_SYSTEM_INSTRUCTION,
        },
      });

      res.json({ text: result.text || "" });
    } catch (error) {
      console.error("AI Support Error:", error);
      res.status(500).json({ error: "Failed to get support response from AI" });
    }
  });

  // Webhook for Payment Confirmation (Cakto)
  app.post("/api/webhook", async (req, res) => {
    const signature = req.headers['x-cakto-signature'];
    const { event, data } = req.body;

    // Verify signature using CAKTO_CLIENT_SECRET
    if (process.env.CAKTO_CLIENT_SECRET && signature) {
      const hmac = crypto.createHmac('sha256', process.env.CAKTO_CLIENT_SECRET);
      const digest = hmac.update(JSON.stringify(req.body)).digest('hex');
      
      if (digest !== signature) {
        console.warn("Invalid webhook signature from Cakto");
        // return res.status(401).send("Invalid signature");
      }
    }

    // Cakto standard webhook event for approved payment
    if (event === "payment.approved" || event === "order.paid") {
      const paymentId = data.id;
      
      try {
        // Extract uid and plan from external_reference (passed in the URL)
        const externalRef = data.external_reference || data.metadata?.external_reference;
        if (!externalRef) {
          console.warn("Missing external_reference in webhook payload");
          return res.status(200).send("OK (Missing ref)");
        }

        const { uid, plan } = JSON.parse(externalRef);
        
        // Update user profile in Firestore
        const userRef = db.collection("users").doc(uid);
        await userRef.update({
          plan: plan,
          hasSelectedPlan: true,
          paymentId: paymentId,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        
        console.log(`Payment approved via Cakto for user ${uid}, plan updated to ${plan}`);
      } catch (error) {
        console.error("Webhook Error:", error);
      }
    }

    res.status(200).send("OK");
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  return app;
}

const appPromise = createServer();

if (process.env.NODE_ENV !== "production" || !process.env.VERCEL) {
  appPromise.then(app => {
    const PORT = Number(process.env.PORT) || 3000;
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  });
}

export default async (req: any, res: any) => {
  const app = await appPromise;
  return app(req, res);
};
