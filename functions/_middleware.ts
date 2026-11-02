// V75 (owner, 2026-11-02): people should only ever see linkup.mn.
// The project's built-in address (hustle-mn-preview.pages.dev) and www.linkup.mn
// send visitors to the same page on https://linkup.mn. Preview deployments
// (<id>.hustle-mn-preview.pages.dev) are not touched, so testing keeps working.
const CANONICAL='https://linkup.mn';
const MOVED=new Set(['hustle-mn-preview.pages.dev','www.linkup.mn']);
type Context={request:Request;next:()=>Promise<Response>};
export function canonicalRedirect(request:Request):Response|null{
 const url=new URL(request.url);
 if(!MOVED.has(url.hostname))return null;
 // 301 for page loads; 308 keeps the method and body for anything else.
 const status=request.method==='GET'||request.method==='HEAD'?301:308;
 return Response.redirect(CANONICAL+url.pathname+url.search,status);
}
export async function onRequest({request,next}:Context):Promise<Response>{
 return canonicalRedirect(request)??next();
}
