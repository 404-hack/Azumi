// import type { R2Bucket } from '@cloudflare/workers-types';

import { dev } from '$app/environment';
import { PUBLIC_R2_URL } from '$env/static/public';

// type UploadResult = {
// 	key: string;
// 	uploadId: string;
// 	etag: string;
// 	parts: Array<{
// 		partNumber: number;
// 		etag: string;
// 	}>;
// };

// export async function uploadToR2(
// 	bucket: R2Bucket,
// 	files: File[] | File,
// 	options: {
// 		partSize?: number;
// 		concurrency?: number;
// 	} = {}
// ): Promise<UploadResult[]> {
// 	if (!bucket) {
// 		throw new Error('R2 bucket is required');
// 	}
// 	const { partSize = 5 * 1024 * 1024, concurrency = 5 } = options;
// 	const filesArray = Array.isArray(files) ? files : [files];
// 	return Promise.all(
// 		filesArray.map(async (file) => {
// 			// 1. Initiate multipart upload
// 			const upload = await bucket.createMultipartUpload(file.name);

// 			// 2. Split file into parts
// 			const partCount = Math.ceil(file.size / partSize);
// 			const parts: Array<{ partNumber: number; etag: string }> = [];

// 			// 3. Upload parts with concurrency
// 			const uploadPromises = [];
// 			for (let i = 0; i < partCount; i++) {
// 				const partNumber = i + 1;
// 				const chunk = file.slice(i * partSize, (i + 1) * partSize);

// 				uploadPromises.push(
// 					// Convert Blob to ArrayBuffer first
// 					chunk
// 						.arrayBuffer()
// 						.then(
// 							(buffer) => upload.uploadPart(partNumber, buffer) // Now using ArrayBuffer
// 						)
// 						.then((part) => {
// 							parts.push({
// 								partNumber,
// 								etag: part.etag
// 							});
// 						})
// 				);

// 				// Maintain concurrency limit
// 				if (uploadPromises.length >= concurrency) {
// 					await Promise.all(uploadPromises);
// 					uploadPromises.length = 0;
// 				}
// 			}

// 			// Wait for remaining uploads
// 			await Promise.all(uploadPromises);

// 			// 4. Complete upload
// 			const object = await upload.complete(parts);

// 			return {
// 				key: upload.key,
// 				uploadId: upload.uploadId,
// 				etag: object.httpEtag,
// 				parts
// 			};
// 		})
// 	);
// }

// lib/r2.client.ts
type UploadResult = {
	key: string;
	url: string;
	uploadId: string;
	etag: string;
	parts: Array<{ partNumber: number; etag: string }>;
};

type R2ClientOptions = {
	partSize?: number;
	concurrency?: number;
};

export class R2Client {
	private bucket: R2Bucket;
	private baseUrl: string;

	constructor(bucket: R2Bucket, options: R2ClientOptions = {}) {
		this.bucket = bucket;
		this.baseUrl = PUBLIC_R2_URL;

		// Ensure base URL ends without slash
		this.baseUrl = this.baseUrl.replace(/\/$/, '');
	}
	public getKeyFromUrl(url: string): string {
		const encodedKey = url.replace(`${this.baseUrl}/`, '');
		return decodeURIComponent(encodedKey);
	}
	private getOptimalConfig(fileSize: number) {
		if (fileSize <= 100 * 1024 * 1024) {
			return { partSize: 5 * 1024 * 1024, concurrency: 5 };
		}
		if (fileSize <= 1 * 1024 * 1024 * 1024) {
			return { partSize: 25 * 1024 * 1024, concurrency: 10 };
		}
		return { partSize: 100 * 1024 * 1024, concurrency: 20 };
	}

	async uploadFiles(files: Array<{ file: File; key: string }> | { file: File; key: string }) {
		const filesArray = Array.isArray(files) ? files : [files];
		return Promise.all(filesArray.map(({ file, key }) => this.uploadFile(file, key)));
	}

	private async uploadFile(file: File, key: string): Promise<UploadResult> {
		const { partSize, concurrency } = this.getOptimalConfig(file.size);
		const upload = await this.bucket.createMultipartUpload(key);

		const partCount = Math.ceil(file.size / partSize);
		const parts: Array<{ partNumber: number; etag: string }> = [];
		const uploadPromises = [];

		for (let i = 0; i < partCount; i++) {
			const partNumber = i + 1;
			const chunk = file.slice(i * partSize, (i + 1) * partSize);

			uploadPromises.push(
				chunk
					.arrayBuffer()
					.then((buffer) => this.uploadPart(upload.key, upload.uploadId, partNumber, buffer))
					.then((part) => parts.push({ partNumber, etag: part.etag }))
			);

			if (uploadPromises.length >= concurrency) {
				await Promise.all(uploadPromises);
				uploadPromises.length = 0;
			}
		}

		await Promise.all(uploadPromises);
		const object = await this.completeUpload(upload.key, upload.uploadId, parts);

		return {
			key: upload.key,
			url: this.getUrl(upload.key),
			uploadId: upload.uploadId,
			etag: object.httpEtag,
			parts
		};
	}

	async uploadPart(key: string, uploadId: string, partNumber: number, body: ArrayBuffer) {
		const upload = this.bucket.resumeMultipartUpload(key, uploadId);
		return upload.uploadPart(partNumber, body);
	}

	async completeUpload(
		key: string,
		uploadId: string,
		parts: Array<{ partNumber: number; etag: string }>
	) {
		const upload = this.bucket.resumeMultipartUpload(key, uploadId);
		return upload.complete(parts);
	}

	async getFile(key: string) {
		const data = await this.bucket.get(key);
		return {
			data,
			url: data ? this.getUrl(key) : null
		};
	}

	getUrl(key: string) {
		return `${this.baseUrl}/${encodeURIComponent(key)}`;
	}

	async deleteFile(key: string) {
		await this.bucket.delete(key);
		return true;
	}
}

// export class R2Client {
// 	private bucket: R2Bucket;
// 	private options: R2ClientOptions;

// 	constructor(bucket: R2Bucket, options: R2ClientOptions = {}) {
// 		this.bucket = bucket;
// 		this.options = {
// 			partSize: 5 * 1024 * 1024, // Default 5MB part size
// 			concurrency: 5, // Default 5 concurrent uploads
// 			...options
// 		};
// 	}

// 	// Upload single or multiple files
// 	async uploadFiles(files: File[] | File): Promise<UploadResult[]> {
// 		const filesArray = Array.isArray(files) ? files : [files];
// 		return Promise.all(filesArray.map((file) => this.uploadFile(file)));
// 	}

// 	// Upload a single file
// 	private async uploadFile(file: File): Promise<UploadResult> {
// 		const { partSize, concurrency } = this.options;

// 		// 1. Initiate multipart upload
// 		const upload = await this.bucket.createMultipartUpload(file.name);

// 		// 2. Split file into parts
// 		const partCount = Math.ceil(file.size / partSize);
// 		const parts: Array<{ partNumber: number; etag: string }> = [];

// 		// 3. Upload parts with concurrency
// 		const uploadPromises = [];
// 		for (let i = 0; i < partCount; i++) {
// 			const partNumber = i + 1;
// 			const chunk = file.slice(i * partSize, (i + 1) * partSize);

// 			uploadPromises.push(
// 				chunk
// 					.arrayBuffer()
// 					.then((buffer) => this.uploadPart(upload.key, upload.uploadId, partNumber, buffer))
// 					.then((part) => {
// 						parts.push({ partNumber, etag: part.etag });
// 					})
// 			);

// 			// Maintain concurrency limit
// 			if (uploadPromises.length >= concurrency) {
// 				await Promise.all(uploadPromises);
// 				uploadPromises.length = 0;
// 			}
// 		}

// 		// Wait for remaining uploads
// 		await Promise.all(uploadPromises);

// 		// 4. Complete upload
// 		const object = await this.completeUpload(upload.key, upload.uploadId, parts);

// 		return {
// 			key: upload.key,
// 			uploadId: upload.uploadId,
// 			etag: object.httpEtag,
// 			parts
// 		};
// 	}

// 	// Upload a single part
// 	async uploadPart(
// 		key: string,
// 		uploadId: string,
// 		partNumber: number,
// 		body: ArrayBuffer
// 	): Promise<R2UploadedPart> {
// 		const upload = this.bucket.resumeMultipartUpload(key, uploadId);
// 		return upload.uploadPart(partNumber, body);
// 	}

// 	// Complete a multipart upload
// 	async completeUpload(
// 		key: string,
// 		uploadId: string,
// 		parts: Array<{ partNumber: number; etag: string }>
// 	): Promise<R2Object> {
// 		const upload = this.bucket.resumeMultipartUpload(key, uploadId);
// 		return upload.complete(parts);
// 	}

// 	// Abort a multipart upload
// 	async abortUpload(key: string, uploadId: string): Promise<void> {
// 		const upload = this.bucket.resumeMultipartUpload(key, uploadId);
// 		await upload.abort();
// 	}

// 	// Get a file
// 	async getFile(key: string): Promise<R2Object | null> {
// 		return this.bucket.get(key);
// 	}

// 	// Delete a file
// 	async deleteFile(key: string): Promise<void> {
// 		await this.bucket.delete(key);
// 	}
// }
