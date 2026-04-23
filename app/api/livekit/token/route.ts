import { AccessToken } from 'livekit-server-sdk';
import { NextRequest, NextResponse } from 'next/server';

const API_KEY = process.env.LIVEKIT_API_KEY;
const API_SECRET = process.env.LIVEKIT_API_SECRET;

export async function GET(req: NextRequest) {
    const { searchParams } = req.nextUrl;
    const room = searchParams.get('room');
    const userId = searchParams.get('userId');
    const name = searchParams.get('name') ?? 'Ẩn danh';

    if (!room || !userId) {
        return NextResponse.json({ error: 'Missing room or userId' }, { status: 400 });
    }
    if (!API_KEY || !API_SECRET) {
        return NextResponse.json({ error: 'LiveKit not configured' }, { status: 500 });
    }

    const at = new AccessToken(API_KEY, API_SECRET, {
        identity: userId,
        name,
        ttl: '4h',
    });

    at.addGrant({
        roomJoin: true,
        room,
        canPublish: true,
        canSubscribe: true,
        canPublishData: true,
    });

    const token = await at.toJwt();
    return NextResponse.json({
        token,
        canPublish: true,
        policyReason: "Bật mic xuyên suốt",
    });
}
