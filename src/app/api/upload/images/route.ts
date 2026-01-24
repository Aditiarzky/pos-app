import { NextResponse } from "next/server";
import { uploadToCloudinary } from "@/lib/cloudinary";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "File tidak ditemukan" },
        { status: 400 },
      );
    }

    // Ubah File ke Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Gunakan fungsi helper yang kita buat di lib
    const result: any = await uploadToCloudinary(buffer, "my-app-folder");

    return NextResponse.json({
      success: true,
      publicId: result.public_id, // Simpan ini ke DB
      secureUrl: result.secure_url, // URL asli cloudinary (opsional)
    });
  } catch (error: any) {
    console.error("Upload Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const publicId = searchParams.get("publicId");

  if (!publicId) {
    return NextResponse.json(
      { error: "Public ID tidak ditemukan" },
      { status: 400 },
    );
  }

  // Gunakan f_auto dan q_auto untuk hasil terbaik
  // f_auto: otomatis pilih format (WebP/AVIF) berdasarkan browser
  // q_auto: otomatis pilih kualitas gambar terbaik dengan ukuran terkecil
  const cloudinaryUrl = `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/f_auto,q_auto/${publicId}`;

  try {
    const response = await fetch(cloudinaryUrl);
    const blob = await response.blob();
    const headers = new Headers();

    headers.set(
      "Content-Type",
      response.headers.get("Content-Type") || "image/webp",
    );
    headers.set("Cache-Control", "public, max-age=31536000, immutable");

    return new NextResponse(blob, { headers });
  } catch (error) {
    return new NextResponse("Not Found", { status: 404 });
  }
}
