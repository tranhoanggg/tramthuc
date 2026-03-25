import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
  try {
    const { cartItems, context, timeLabel } = await req.json();

    let dynamicMenuString = "";
    try {
      const productApiUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:10000";
      const menuResponse = await fetch(`${productApiUrl}/api/products`);

      if (menuResponse.ok) {
        const menuData = await menuResponse.json();
        const productsList = menuData.data ? menuData.data : menuData;
        dynamicMenuString = productsList
          .map(
            (item: any) =>
              `- ID: ${item.id}, Tên: ${item.name}, Giá: ${item.price}, Ảnh: ${item.image_url}`,
          )
          .join("\n");
      }
    } catch (e) {
      console.error("Lỗi fetch menu:", e);
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // 2. XÂY DỰNG PROMPT DỰA TRÊN NGỮ CẢNH (CONTEXT)
    let prompt = "";

    if (context === "home") {
      // Ngữ cảnh Trang chủ: Gợi ý theo khung giờ
      prompt = `
        Bạn là chuyên gia menu tại quán "Trạm Thức". Hiện tại là ${timeLabel}.
        Dựa vào menu sau:
        ${dynamicMenuString}

        Nhiệm vụ: Chọn ra ĐÚNG 4 món (ưu tiên 2 nước, 2 đồ ăn) phù hợp nhất với tâm trạng "${timeLabel}".
        YÊU CẦU ĐỊNH DẠNG: Trả về CHỈ là một mảng JSON. 
        Mỗi object: {"productId": number, "name": "string", "price": number, "imageUrl": "string"}.
      `;
    } else {
      // Ngữ cảnh Giỏ hàng: Gợi ý mua kèm (Cross-sell)
      const cartNames =
        cartItems?.map((item: any) => item.name).join(", ") ||
        "chưa có món nào";
      const cartIds =
        cartItems?.map((item: any) => item.productId).join(", ") || "";

      prompt = `
        Bạn là chuyên gia bán hàng tại quán "Trạm Thức". Khách đang có trong giỏ: ${cartNames}.
        Dựa vào menu sau:
        ${dynamicMenuString}

        Nhiệm vụ: Chọn ra 3 món phù hợp để mua kèm. 
        LƯU Ý: Không gợi ý lại món đã có trong giỏ (ID: ${cartIds}).
        YÊU CẦU ĐỊNH DẠNG: Trả về CHỈ là một mảng JSON.
        Mỗi object: {"productId": number, "name": "string", "price": number, "imageUrl": "string"}.
      `;
    }

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const cleanedText = text.replace(/```json|```/g, "").trim();

    return NextResponse.json(JSON.parse(cleanedText));
  } catch (error) {
    console.error("AI Error:", error);
    return NextResponse.json([]);
  }
}
