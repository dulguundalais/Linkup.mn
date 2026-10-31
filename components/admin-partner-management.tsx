'use client';
import {useEffect,useState} from 'react';
import {marketplaceClient} from '../lib/marketplace/client';
type Item={user_id:string;display_name:string;contact_email:string;partner_kind:string;promotion_channel:string;tier:'community'|'growth';status:'active'|'suspended';created_at:string};
export default function AdminPartnerManagement({en}:{en:boolean}){
 const [items,setItems]=useState<Item[]>([]);
 const [loading,setLoading]=useState(true),[busy,setBusy]=useState(''),[error,setError]=useState(''),[notice,setNotice]=useState('');
 const t=(mn:string,english:string)=>en?english:mn;
 async function load(){
  setLoading(true);
  try{const db=await marketplaceClient();const result=await db.from('partner_memberships').select('user_id,display_name,contact_email,partner_kind,promotion_channel,tier,status,created_at').order('created_at',{ascending:false}).limit(100);if(result.error)throw result.error;setItems((result.data||[]) as Item[])}
  catch(e){setError(e instanceof Error?e.message:t('Түншийн мэдээлэл ачаалж чадсангүй.','Could not load partners.'))}
  finally{setLoading(false)}
 }
 useEffect(()=>{void load()},[]);
 async function change(item:Item,field:'tier'|'status',value:string){
  if(busy)return;
  setBusy(item.user_id);setError('');setNotice('');
  try{
   const db=await marketplaceClient();
   const args={p_user:item.user_id,p_status:field==='status'?value:item.status,p_tier:field==='tier'?value:item.tier};
   const result=await db.rpc('manage_partner_membership',args);if(result.error)throw result.error;
   setNotice(t('Түншийн эрх шинэчлэгдлээ.','Partner status updated.'));await load();
  }catch(e){setError(e instanceof Error?e.message:t('Эрх шинэчлэхэд алдаа гарлаа.','Could not update partner.'))}
  finally{setBusy('')}
 }
 return <section className="workspace-panel" aria-labelledby="admin-partners-title">
  <div className="row-between"><h2 id="admin-partners-title">{t('Түншийн эрхийн удирдлага','Partner management')}</h2><button className="button outline small" disabled={loading} onClick={()=>void load()}>{t('Шинэчлэх','Refresh')}</button></div>
  <p>{t('Нийтийн түншүүд автоматаар элсдэг. Админ зөвхөн эрх түдгэлзүүлэх болон Growth түвшин тохируулах боломжтой.','Community partners enroll automatically. Admins can suspend access or set Growth tier.')}</p>
  {notice&&<p role="status">{notice}</p>}{error&&<p role="alert">{error}</p>}
  {loading?<p>{t('Түншүүдийг ачаалж байна…','Loading partners…')}</p>:items.length===0?<p>{t('Одоогоор идэвхтэй түнш бүртгэгдээгүй.','No partners registered yet.')}</p>:
  <div className="table-scroll"><table><thead><tr><th>{t('Түнш','Partner')}</th><th>{t('Төрөл','Type')}</th><th>{t('Түвшин','Tier')}</th><th>{t('Эрх','Status')}</th></tr></thead><tbody>{items.map(item=><tr key={item.user_id}><td><strong>{item.display_name}</strong><small style={{display:'block'}}>{item.contact_email}</small></td><td>{item.partner_kind==='business'?t('Байгууллага','Business'):t('Хувь хүн','Individual')}</td><td><select aria-label={t('Түншийн түвшин','Partner tier')} value={item.tier} disabled={!!busy} onChange={e=>void change(item,'tier',e.target.value)}><option value="community">Community</option><option value="growth">Growth</option></select></td><td><select aria-label={t('Түншийн эрх','Partner status')} value={item.status} disabled={!!busy} onChange={e=>void change(item,'status',e.target.value)}><option value="active">{t('Идэвхтэй','Active')}</option><option value="suspended">{t('Түдгэлзүүлсэн','Suspended')}</option></select></td></tr>)}</tbody></table></div>}
 </section>;
}
