import {
	BUCKET_NAME,
	R2_ACCESS_KEY_ID,
	R2_ENDPOINT,
	R2_SECRET_ACCESS_KEY
} from '$env/static/private';
import { PUBLIC_R2_URL } from '$env/static/public';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export const s3Client = new S3Client({
	region: 'auto',
	endpoint: R2_ENDPOINT,
	credentials: {
		accessKeyId: R2_ACCESS_KEY_ID,
		secretAccessKey: R2_SECRET_ACCESS_KEY
	}
});

export async function generatePresignedUrl(fileName: string, contentType: string) {
	const command = new PutObjectCommand({
		Bucket: BUCKET_NAME,
		Key: fileName,
		ContentType: contentType
	});

	try {
		const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
		const publicUrl = `${PUBLIC_R2_URL}/${fileName}`;
		return { url, key: fileName, publicUrl };
	} catch (error) {
		console.error('Error generating presigned URL:', error);
		throw error;
	}
}
