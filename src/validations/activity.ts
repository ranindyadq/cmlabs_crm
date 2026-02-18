import { z } from "zod";

export const quickActivitySchema = z.object({
  activityType: z.enum(["NOTE", "CALL", "EMAIL", "MEETING", "INVOICE_CREATED"], {
    errorMap: () => ({ message: "Please select an activity type" })
  }),
  // Backend mewajibkan title tidak boleh kosong (min 1) untuk Meeting & Invoice, 
  // kita pukul rata wajib untuk semua agar rapi di UI.
  title: z.string().min(1, "Title is required").max(100, "Title is too long"),
  description: z.string().max(500, "Description cannot exceed 500 characters").optional(),
}).refine((data) => {
  // LOGIKA CERDAS: Sesuaikan dengan Backend Schema kamu!
  // Backend mewajibkan 'content' untuk Note dan 'body' untuk Email.
  // Di modal ini, keduanya diambil dari field 'description'.
  if ((data.activityType === "NOTE" || data.activityType === "EMAIL") && (!data.description || data.description.trim() === "")) {
    return false;
  }
  return true;
}, {
  message: "Description is required for Notes and Emails",
  path: ["description"] // Mengarahkan pesan error ke kolom input description
});

export type QuickActivityInput = z.infer<typeof quickActivitySchema>;