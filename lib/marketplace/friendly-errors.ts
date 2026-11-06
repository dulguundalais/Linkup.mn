// V52 — turn Supabase/PostgREST/network failures into short bilingual messages.
// Raw database text (table names, constraint names, SQL details) is never shown.
// Errors the app throws itself (plain Error without a code) are already written for
// people and pass through unchanged.

type Pair=[string,string];
// Messages raised by our own database guards, translated for both languages.
const KNOWN:Record<string,Pair>={
 'Beta access required':['Энэ үйлдлийг хийхийн тулд имэйлээ баталгаажуулсан бүртгэлээр нэвтэрнэ үү.','Please sign in with an e-mail-verified account to do this.'],
 'Admin only':['Энэ үйлдлийг зөвхөн админ хийх боломжтой.','Only an admin can do this.'],
 'Service unavailable':['Энэ үйлчилгээ одоогоор захиалга авахгүй байна.','This service is not taking orders right now.'],
 'Invalid order transition':['Захиалгын төлөв өөрчлөгдсөн байна. Хуудсаа шинэчлээд дахин оролдоно уу.','The order has changed. Refresh and try again.'],
 'Choose a valid next status':['Захиалгын төлөв өөрчлөгдсөн байна. Хуудсаа шинэчлээд дахин оролдоно уу.','The order has changed. Refresh and try again.'],
 'Immutable order fields':['Батлагдсан захиалгын нөхцөлийг өөрчлөх боломжгүй.','Agreed order terms cannot be changed.'],
 'Delivery note required':['Хүлээлгэн өгөх ажлын тайлбарыг бичнэ үү.','Add a delivery note.'],
 'Only seller may edit delivery':['Зөвхөн мэргэжилтэн ажлаа хүлээлгэн өгнө.','Only the freelancer can deliver the work.'],
 'Revision limit reached':['Энэ багцын засварын эрх дууссан байна.','This package has no revisions left.'],
 'Only buyer may request revisions':['Зөвхөн захиалагч засвар хүснэ.','Only the client can request a revision.'],
 'Describe the requested revision':['Ямар засвар хэрэгтэйгээ тайлбарлана уу.','Describe the revision you need.'],
 'Revision note is immutable outside revision request':['Засварын тайлбарыг одоо өөрчлөх боломжгүй.','The revision note cannot be changed now.'],
 'Seller profile required':['Эхлээд мэргэжилтний профайлаа идэвхжүүлнэ үү.','Turn on your freelancer profile first.'],
 'Beta seller required':['Эхлээд мэргэжилтний профайлаа идэвхжүүлнэ үү.','Turn on your freelancer profile first.'],
 'Approved beta buyer profile required':['Таны бүртгэлийг бэлдэж байна. Хуудсаа шинэчлээд дахин оролдоно уу.','Your account is being prepared. Refresh and try again.'],
 'Service not owned by this seller':['Энэ үйлчилгээ таных биш байна.','This service is not yours.'],
 'Service must be draft or pending review':['Нийтлэгдсэн үйлчилгээг шууд засах боломжгүй.','A published service cannot be edited directly.'],
 'Service update blocked':['Үйлчилгээг одоо засах боломжгүй.','This service cannot be edited right now.'],
 'Prices must follow Basic ≤ Standard ≤ Premium':['Суурь багцын үнэ Стандартаас, Стандартын үнэ Дээд багцаас их байж болохгүй.','Prices must rise from Basic to Standard to Premium.'],
 'Exactly one of each package tier is required':['Суурь, Стандарт, Дээд гурван багцыг бүгдийг бөглөнө үү.','Fill in all three packages: Basic, Standard and Premium.'],
 'Basic, Standard, Premium are all required':['Суурь, Стандарт, Дээд гурван багцыг бүгдийг бөглөнө үү.','Fill in all three packages: Basic, Standard and Premium.'],
 'Basic, Standard and Premium are all required':['Суурь, Стандарт, Дээд гурван багцыг бүгдийг бөглөнө үү.','Fill in all three packages: Basic, Standard and Premium.'],
 'Invalid package price, delivery or revision count':['Багцын үнэ, хугацаа эсвэл засварын тоо буруу байна.','A package price, delivery time or revision count is invalid.'],
 'Package name or summary is invalid':['Багцын нэр эсвэл товч тайлбарыг шалгана уу.','Check the package name and summary.'],
 'Each tier requires 1–12 clear inclusions, max 120 characters each':['Багц бүрт хийх 1–12 ажлыг бичнэ үү. Тус бүр 120 тэмдэгтээс ихгүй байна.','Each package needs 1–12 items of up to 120 characters.'],
 'Invalid project details':['Төслийн мэдээллээ шалгана уу.','Check the project details.'],
 'Daily project request limit reached':['Өнөөдрийн төслийн хүсэлтийн хязгаарт хүрлээ. Маргааш дахин оролдоно уу.','You have reached today’s project request limit. Try again tomorrow.'],
 'Proposal unavailable':['Энэ саналыг сонгох боломжгүй болсон байна.','This proposal is no longer available.'],
 'You are sending messages too quickly. Please wait a minute.':['Хэт хурдан мессеж илгээж байна. Нэг минут хүлээгээд дахин оролдоно уу.','You are sending messages too quickly. Please wait a minute.'],
 'You have started many new conversations today. Please try again tomorrow.':['Өнөөдөр олон шинэ яриа эхлүүлсэн байна. Маргааш дахин оролдоно уу.','You have started many new conversations today. Please try again tomorrow.']
};
const BY_CODE:Record<string,Pair>={
 'provider_disabled':['Google-ээр нэвтрэх боломж одоогоор идэвхгүй байна. Имэйлээр нэвтэрнэ үү.','Google sign-in is currently unavailable. Please sign in with email.'],
 'google_oauth_cancelled':['Google-ээр нэвтрэх үйлдлийг цуцаллаа. Дахин оролдох боломжтой.','Google sign-in was cancelled. You can try again.'],
 'google_oauth_failed':['Google-ээр нэвтэрч чадсангүй. Дахин оролдоно уу.','Google sign-in could not be completed. Please try again.'],
 'email_not_confirmed':['Имэйлээ баталгаажуулаагүй байна. Ирсэн имэйл болон Спам хавтаснаас баталгаажуулах холбоосоо нээнэ үү.','Your email is not confirmed. Check Inbox and Spam for the confirmation link.'],
 'invalid_credentials':['Имэйл эсвэл нууц үг буруу байна.','The e-mail or password is incorrect.'],
 'user_already_exists':['Энэ имэйлээр бүртгэл үүсгэсэн байна. Нэвтэрнэ үү.','An account already exists for this e-mail. Please sign in.'],
 'email_exists':['Энэ имэйлээр бүртгэл үүсгэсэн байна. Нэвтэрнэ үү.','An account already exists for this e-mail. Please sign in.'],
 'weak_password':['Нууц үг хэт энгийн байна. Илүү урт, үсэг тоо холилдсон нууц үг сонгоно уу.','The password is too weak. Use a longer mix of letters and numbers.'],
 'same_password':['Шинэ нууц үг хуучнаасаа өөр байх ёстой.','Choose a password different from your current one.'],
 'over_request_rate_limit':['Хэт олон удаа оролдлоо. Хэсэг хугацааны дараа дахин оролдоно уу.','Too many attempts. Please wait and try again.'],
 'session_not_found':['Нэвтрэлтийн хугацаа дууссан байна. Дахин нэвтэрнэ үү.','Your session has expired. Please sign in again.'],
 'refresh_token_not_found':['Нэвтрэлтийн хугацаа дууссан байна. Дахин нэвтэрнэ үү.','Your session has expired. Please sign in again.'],
 'PGRST301':['Нэвтрэлтийн хугацаа дууссан байна. Дахин нэвтэрнэ үү.','Your session has expired. Please sign in again.'],
 '42501':['Энэ үйлдлийг хийх эрх алга байна. Дахин нэвтэрч үзнэ үү.','You do not have permission to do this. Try signing in again.'],
 '23505':['Энэ мэдээлэл аль хэдийн бүртгэлтэй байна.','This already exists.'],
 '23514':['Оруулсан мэдээллээ шалгана уу.','Please check the details you entered.'],
 '23503':['Холбогдох мэдээлэл олдсонгүй. Хуудсаа шинэчлээд дахин оролдоно уу.','Something this depends on is missing. Refresh and try again.'],
 '22001':['Оруулсан текст хэт урт байна.','The text is too long.'],
 'PGRST116':['Мэдээлэл олдсонгүй эсвэл хандах эрхгүй байна.','Not found, or you do not have access.']
};
export function friendlyError(error:unknown,en:boolean):string{
 const pick=(p:Pair)=>en?p[1]:p[0];
 const e=error as {code?:unknown;status?:unknown;message?:unknown;name?:unknown}|null;
 const message=typeof e?.message==='string'?e.message.trim():'';
 const code=typeof e?.code==='string'?e.code:'';
 if(message&&KNOWN[message])return pick(KNOWN[message]);
 if(code&&BY_CODE[code])return pick(BY_CODE[code]);
 if(/popup.closed|user cancelled|user canceled/i.test(message))return pick(BY_CODE.google_oauth_cancelled);
 if(/unsupported provider|provider is not enabled/i.test(message))return pick(BY_CODE.provider_disabled);
 if(/email not confirmed/i.test(message))return pick(BY_CODE.email_not_confirmed);
 if(/invalid login credentials/i.test(message))return pick(BY_CODE.invalid_credentials);
 if(/jwt expired|session.*(missing|expired)/i.test(message))return pick(BY_CODE.session_not_found);
 if(/failed to fetch|networkerror|load failed|network request failed/i.test(message)||e?.name==='TypeError'&&!code)
  return en?'Network problem. Check your connection and try again.':'Сүлжээний алдаа. Интернэт холболтоо шалгаад дахин оролдоно уу.';
 // Our own UI errors: a plain Error with no code/status is already written for people.
 if(error instanceof Error&&!code&&e?.status===undefined&&message)return message;
 return en?'Something went wrong. Please try again.':'Үйлдэл амжилтгүй боллоо. Дахин оролдоно уу.';
}
