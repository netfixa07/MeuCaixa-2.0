import axios from "axios";
import { AIResponse, UserProfile, Product, Person } from "../types";

export async function getSupportResponse(message: string): Promise<string> {
  try {
    const response = await axios.post("/api/ai/support", { message });
    return response.data.text || "Desculpe, não consegui processar sua solicitação no momento.";
  } catch (error) {
    console.error("Error getting support response:", error);
    return "Ocorreu um erro ao tentar falar com o assistente. Por favor, tente novamente mais tarde.";
  }
}

export async function parseFinancialMessage(
  message: string,
  userProfile: UserProfile,
  products: Product[] = [],
  people: Person[] = []
): Promise<AIResponse | null> {
  try {
    const context = {
      plano: userProfile.plan,
      empresa: {
        nome: userProfile.nomeEmpresa,
        nicho: userProfile.nicho,
        descricao: userProfile.descricaoEmpresa
      },
      aprendizado: userProfile.aprendizado || [],
      data: new Date().toISOString().split('T')[0],
      produtosDisponiveis: products.map(p => ({ id: p.id, nome: p.nome, preco: p.preco })),
      pessoasDisponiveis: people.map(p => ({ id: p.id, nome: p.nome, tipo: p.tipo }))
    };

    const response = await axios.post("/api/ai/process", { message, context });
    return response.data;
  } catch (error) {
    console.error("Error parsing message with AI:", error);
    return null;
  }
}
