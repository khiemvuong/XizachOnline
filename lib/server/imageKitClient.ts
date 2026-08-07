import ImageKit from "imagekit";

let imageKitClient: ImageKit | undefined;

export function getImageKitClient() {
  if (imageKitClient) return imageKitClient;

  const publicKey = process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY;
  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
  const urlEndpoint = process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT;

  const missingVariables = [
    ["NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY", publicKey],
    ["IMAGEKIT_PRIVATE_KEY", privateKey],
    ["NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT", urlEndpoint],
  ]
    .filter(([, value]) => !value)
    .map(([name]) => name);

  if (missingVariables.length > 0) {
    throw new Error(`Missing ImageKit environment variables: ${missingVariables.join(", ")}`);
  }

  imageKitClient = new ImageKit({
    publicKey: publicKey!,
    privateKey: privateKey!,
    urlEndpoint: urlEndpoint!,
  });

  return imageKitClient;
}
