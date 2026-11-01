// Google OAuth istemci kimliği (Google Cloud Console → API'ler ve Hizmetler → Kimlik bilgileri).
// Derleme sırasında VITE_GOOGLE_CLIENT_ID ortam değişkeninden okunur; değeri depodaki .env dosyasında durur.
// Web uygulamalarında bu kimlik gizli değildir; sayfanın kaynağında herkes görebilir. Güvenliği,
// Google'ın yalnızca "Yetkili JavaScript kaynakları" listesindeki adreslerden gelen girişlere izin vermesi sağlar.
// Boşken Google Drive senkronizasyonu "kurulum bekleniyor" olarak görünür, uygulamanın geri kalanı etkilenmez.
export const GOOGLE_CLIENT_ID: string = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";
