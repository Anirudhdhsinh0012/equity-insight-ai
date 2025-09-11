import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
	// Placeholder minimal handler to satisfy module requirement
	res.status(200).json({ ok: true, message: 'Socket.io placeholder endpoint' });
}
