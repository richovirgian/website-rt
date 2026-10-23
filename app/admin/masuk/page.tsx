import { redirect } from "next/navigation";

/** Alamat lama halaman masuk. Dipertahankan supaya tautan lama tetap jalan. */
export default function MasukLama() {
  redirect("/masuk");
}
