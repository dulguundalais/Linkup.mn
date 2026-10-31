export type Localized={mn:string;en:string};
export type InfoSection={id:string;title:Localized;paragraphs:Localized[];bullets:Localized[]};
export type InfoPage={label:Localized;title:Localized;subtitle:Localized;review?:boolean;sections:InfoSection[]};
export const informationPages:Record<string,InfoPage>={
  "about": {
    "label": {
      "mn": "БИДНИЙ ТУХАЙ",
      "en": "ABOUT LINKUP"
    },
    "title": {
      "mn": "Ур чадвар, боломжийг холбох газар.",
      "en": "A home for ambitious talent."
    },
    "subtitle": {
      "mn": "Linkup бол Монголын бүтээлч, дижитал үйлчилгээ үзүүлэгчид болон төсөл хэрэгжүүлэх хүмүүст зориулсан үйлчилгээний платформ.",
      "en": "Linkup is a services marketplace connecting independent creatives and digital professionals with people building meaningful projects."
    },
    "sections": [
      {
        "id": "mission",
        "title": {
          "mn": "Бидний зорилго",
          "en": "Our mission"
        },
        "paragraphs": [
          {
            "mn": "Чадвартай хүн өөрийгөө танилцуулах, үйлчлүүлэгч хамгийн тохирох мэргэжилтнээ олж холбогдох үйл явцыг энгийн, ил тод, итгэлтэй болгоно.",
            "en": "We make it easier for skilled people to show their work and for clients to discover, evaluate and collaborate with the right expert."
          },
          {
            "mn": "Монгол болон англи хэлтэй интерфэйс, ойлгомжтой үйлчилгээний багц, нэг дор төвлөрсөн харилцаа ба захиалгын явц нь платформын үндсэн чиглэл юм.",
            "en": "A bilingual experience, transparent service packages and a shared space for messages and order progress are core to the product."
          }
        ],
        "bullets": []
      },
      {
        "id": "experience",
        "title": {
          "mn": "Платформ дээр юу хийж болох вэ?",
          "en": "What can you do on Linkup?"
        },
        "paragraphs": [
          {
            "mn": "Захиалагч бодит, нийтлэгдсэн үйлчилгээ хайж, мэргэжилтний мэдээлэлтэй танилцаж, Суурь / Стандарт / Дээд багцыг харьцуулж, чат эхлүүлэх боломжтой.",
            "en": "Buyers can explore published listings, review freelancer profiles, compare Basic / Standard / Premium packages and start a conversation."
          },
          {
            "mn": "Мэргэжилтэн өөрийн профайл, бүтээлүүд, үйлчилгээ болон үнийн багцаа удирдаж, захиалгын хүсэлт, хүргэлт, засварын явцыг хянадаг.",
            "en": "Freelancers can maintain a profile, portfolio and service packages and manage requests, delivery and revision workflows."
          }
        ],
        "bullets": []
      },
      {
        "id": "beta",
        "title": {
          "mn": "Одоогийн хөгжүүлэлтийн шат",
          "en": "Current stage"
        },
        "paragraphs": [
          {
            "mn": "Linkup нээлттэй бета туршилтын шатанд байна. Шинэ хэрэглэгч имэйлээ баталгаажуулаад шууд ашиглаж болно.",
            "en": "Linkup is in open beta. New users can access their workspace after email verification without manual approval."
          },
          {
            "mn": "Одоогоор бодит мөнгөн төлбөр, эскроу санхүүгийн хамгаалалт, банк болон QPay холболт ажиллахгүй. Дэлгэцэд харагдах үнэ, урилгын урамшуулал нь туршилтын мэдээлэл бөгөөд төлбөр нэхэмжилсэн гэсэн үг биш.",
            "en": "Real payments, escrow, bank and QPay integrations are not active. Prices and referral rewards shown in beta are informational/test values, not payment demands or payouts."
          }
        ],
        "bullets": []
      },
      {
        "id": "principles",
        "title": {
          "mn": "Бидний баримтлах зарчим",
          "en": "Our product principles"
        },
        "paragraphs": [
          {
            "mn": "Хуурамч рейтинг, баталгаагүй захиалгын тоо, үл хэрэгжсэн хамгаалалтыг бодит мэт харуулахгүй. Нийтэд харагдах мэргэжилтэн мэдээлэл нь зөвшөөрөгдсөн профайлаас гарна.",
            "en": "We do not present invented ratings, order volumes or unreleased financial protections as facts. Public freelancer discovery depends on opted-in profiles."
          },
          {
            "mn": "Төслийн явцад буцаан засах боломжтой, тодорхой эрхийн хяналттай, хөгжүүлэгчид үргэлжлүүлэн дэмжиж болох архитектурыг эрхэмлэнэ.",
            "en": "We value clear access controls, reversible development practices and an architecture maintainable by professional engineers."
          }
        ],
        "bullets": []
      }
    ]
  },
  "terms": {
    "label": {
      "mn": "ҮЙЛЧИЛГЭЭНИЙ НӨХЦӨЛ",
      "en": "TERMS OF USE"
    },
    "title": {
      "mn": "Хэрэглэх нөхцөл ба платформын дүрэм.",
      "en": "Transparent terms for working together."
    },
    "subtitle": {
      "mn": "Энэхүү баримт бичиг нь Linkup-ын нээлттэй бета туршилтын үеийн үйлчилгээний нөхцөлийн санал болгож буй төсөл юм.",
      "en": "This document describes proposed platform terms for the Linkup open beta. It is a draft for operator and legal review."
    },
    "review": true,
    "sections": [
      {
        "id": "scope",
        "title": {
          "mn": "1. Үйлчилгээний хамрах хүрээ",
          "en": "1. Platform scope"
        },
        "paragraphs": [
          {
            "mn": "Linkup нь бие даасан мэргэжилтэн (Мэргэжилтэн) болон үйлчилгээ захиалагч (Захиалагч)-ийг холбох технологийн орчин юм. Платформ өөрөө мэргэжилтний гүйцэтгэх ажлын чанар, үр дүнг автоматаар баталгаажуулахгүй.",
            "en": "Linkup provides a digital environment to connect independent service providers (Sellers) with Buyers. The platform does not automatically warrant a freelancer's work or results."
          },
          {
            "mn": "Энэхүү нөхцөл нь одоогийн нээлттэй бета туршилтын функцийг тайлбарлана. Төлбөртэй үйлчилгээ нэвтрэхэд нэмэлт нөхцөл, тусгай зөвшөөрөл болон үнэ, татварын мэдээлэл шаардлагатай.",
            "en": "These terms describe current open-beta capabilities. Any future paid launch requires additional terms, verified operator disclosures and applicable payment/tax arrangements."
          }
        ],
        "bullets": []
      },
      {
        "id": "access",
        "title": {
          "mn": "2. Бүртгэл ба бета эрх",
          "en": "2. Registration and beta access"
        },
        "paragraphs": [
          {
            "mn": "Хэрэглэгч өөрийн хянадаг имэйлээр бүртгүүлж, баталгаажуулалтыг гүйцэтгэх ёстой. Шинэ хэрэглэгч имэйлээ баталгаажуулмагц энгийн гишүүний эрх автоматаар олгогдоно. Аюулгүй байдлын үүднээс бүртгэлийн хандалтыг хязгаарлаж болно.",
            "en": "Users must register with an email address they control and complete required verification. Verified new accounts receive standard member access automatically; accounts can be restricted for safety."
          },
          {
            "mn": "Нэвтрэх мэдээллээ хамгаалах, өөрийн бүртгэлд хийгдсэн үйлдлийг хянах үүрэг хэрэглэгчид байна. Нэг хүн захиалагч болон мэргэжилтэн горимыг ашиглаж болно; админ эрхийг зөвхөн эрх бүхий этгээд олгоно.",
            "en": "Users are responsible for safeguarding credentials and activity in their accounts. One account may act as Buyer and Seller; administrator privileges are assigned separately."
          }
        ],
        "bullets": []
      },
      {
        "id": "profiles",
        "title": {
          "mn": "3. Профайл, үйлчилгээ, багц",
          "en": "3. Profiles, listings and packages"
        },
        "paragraphs": [
          {
            "mn": "Мэргэжилтэн өөрийн нэр, туршлага, бүтээлүүд болон үйлчилгээний мэдээллийг үнэн зөв оруулах ёстой. Бусдын бүтээл, оюуны өмчийг зөвшөөрөлгүй ашиглаж болохгүй.",
            "en": "Sellers should provide accurate profile, experience, portfolio and listing information, and must not upload work they have no right to use."
          },
          {
            "mn": "Үйлчилгээ Суурь, Стандарт, Дээд багцаар ялгарч болох бөгөөд тус бүрийн үнэ, хугацаа, засвар, багтсан ажлыг тодорхой танилцуулна. Нийтлэх хүсэлтийг админ хянаж болно.",
            "en": "Services may offer Basic, Standard and Premium tiers with stated price, delivery period, revisions and inclusions. Listing publication may be subject to moderation."
          }
        ],
        "bullets": []
      },
      {
        "id": "orders",
        "title": {
          "mn": "4. Захиалга ба ажлын явц",
          "en": "4. Requests and work progress"
        },
        "paragraphs": [
          {
            "mn": "Захиалагч захиалгын хүсэлтэд ажлын шаардлагаа тодорхой бичнэ. Мэргэжилтэн хүсэлтийг хүлээн авах, гүйцэтгэх, хүлээлгэн өгөх төлөвт шилжүүлнэ. Хүргэлт ба засварын тэмдэглэл нь тухайн захиалгын бүртгэлийн нэг хэсэг болно.",
            "en": "Buyers should describe their requirements clearly. Sellers move requests through acceptance, progress and delivery; delivery and revision notes form part of the order record."
          },
          {
            "mn": "Захиалга үүсэх үеийн сонгосон багцын үнэ, хугацаа, засварын хязгаар нь тухайн хүсэлтийн хадгалсан нөхцөл болно. Багцын дараагийн өөрчлөлт өмнөх захиалгын хадгалсан нөхцөлийг автоматаар өөрчлөхгүй.",
            "en": "Selected package price, delivery time and revision limits are recorded as an order snapshot. Subsequent listing changes do not automatically rewrite existing orders."
          }
        ],
        "bullets": []
      },
      {
        "id": "payments",
        "title": {
          "mn": "5. Төлбөр, шимтгэл, эскроу",
          "en": "5. Payments, commission and escrow"
        },
        "paragraphs": [
          {
            "mn": "Нээлттэй бета туршилтад платформ бодит мөнгө хүлээн авахгүй, төлбөр шилжүүлэхгүй, эскроу данс ажиллуулахгүй. Дэлгэцэд харагдах төгрөгийн үнэ болон 10% платформын шимтгэлийн дүрэм нь санхүүгийн гүйлгээ биш.",
            "en": "During open beta the platform does not collect or remit real money and does not operate escrow. MNT prices and the configurable 10% platform commission are not evidence of an actual transaction."
          },
          {
            "mn": "Ирээдүйн төлбөр, буцаан олголт, эскроу болон татварын дүрмийг бодит үйлчилгээ эхлэхээс өмнө тусад нь нийтэлж, эрх зүйн шаардлагаар нягтална.",
            "en": "Payment, refund, escrow and tax policies for any future paid service will need separate publication and legal review before activation."
          }
        ],
        "bullets": []
      },
      {
        "id": "rights",
        "title": {
          "mn": "6. Контент ба оюуны өмч",
          "en": "6. Content and intellectual property"
        },
        "paragraphs": [
          {
            "mn": "Хэрэглэгч өөрийн хууль ёсоор эзэмшдэг эсвэл ашиглах эрхтэй материалыг байршуулна. Платформд байршуулснаар тухайн контентын өмчлөх эрх автоматаар Linkup-д шилжихгүй.",
            "en": "Users may upload material they own or are licensed to use. Uploading content does not automatically transfer ownership of that content to Linkup."
          },
          {
            "mn": "Захиалагч болон Мэргэжилтэн хооронд ажлын эцсийн файлын ашиглах эрх, шилжүүлэх нөхцөл, лиценз зэрэг асуудлыг ажлын эхэнд бичгээр тохиролцох нь зүйтэй. Бета хувилбар зохиогчийн эрхийг автоматаар шилжүүлэх механизм агуулаагүй.",
            "en": "Buyers and Sellers should explicitly agree on final deliverable licensing, usage and ownership. The beta does not automatically execute an intellectual-property transfer."
          }
        ],
        "bullets": []
      },
      {
        "id": "conduct",
        "title": {
          "mn": "7. Хориглох үйлдэл",
          "en": "7. Prohibited conduct"
        },
        "paragraphs": [
          {
            "mn": "Хуурамч мэдээлэл, залилан, бусдын мэдээлэлд зөвшөөрөлгүй хандах, үзэн ядалт өдөөх, сүрдүүлэх, хууль бус бүтээгдэхүүн/үйлчилгээ санал болгох, платформын аюулгүй байдалд халдахыг хориглоно.",
            "en": "Fraud, impersonation, unauthorized access, harassment, unlawful services and attacks on platform security are prohibited."
          },
          {
            "mn": "Хэрэглэгчдийн хувийн мэдээлэл, чат, хүлээлгэн өгсөн материалыг зөвшөөрөлгүй нийтлэх эсвэл гуравдагч этгээдэд дамжуулж болохгүй.",
            "en": "Users must not publish or disclose others' personal information, conversations or deliverables without appropriate authorization."
          }
        ],
        "bullets": []
      },
      {
        "id": "moderation",
        "title": {
          "mn": "8. Хяналт ба хязгаарлалт",
          "en": "8. Moderation and restrictions"
        },
        "paragraphs": [
          {
            "mn": "Хууль зөрчсөн, төөрөгдүүлсэн, бусдын эрхийг зөрчсөн эсвэл бета туршилтын аюулгүй байдалд эрсдэл учруулах үйлчилгээг нийтлэхээс татгалзах, нуух, хандах эрхийг хязгаарлах боломжтой.",
            "en": "Listings may be declined or hidden, and access restricted, where content is unlawful, misleading, rights-infringing or threatens beta safety."
          },
          {
            "mn": "Бүртгэлийн болон зарын хяналт автомат болон админ үйл ажиллагаанаас хамаарах бөгөөд бүрэн, тасралтгүй хяналтыг амлахгүй.",
            "en": "Moderation may involve product safeguards and manual administration; it is not a promise of constant or exhaustive review."
          }
        ],
        "bullets": []
      },
      {
        "id": "availability",
        "title": {
          "mn": "9. Үйлчилгээний бэлэн байдал",
          "en": "9. Beta availability"
        },
        "paragraphs": [
          {
            "mn": "Бета хувилбарт функц нэмэгдэх, өөрчлөгдөх, түр хугацаанд ажиллахгүй болох боломжтой. Бодит санхүүгийн амлалт, тогтмол тасралтгүй ажиллагаа болон захиалга биелэх баталгаагүй.",
            "en": "Features may change or be unavailable during beta. The platform does not promise financial settlement, uninterrupted uptime or the performance of a specific seller."
          }
        ],
        "bullets": []
      },
      {
        "id": "disputes",
        "title": {
          "mn": "10. Санал зөрөлдөөн",
          "en": "10. Disputes and complaints"
        },
        "paragraphs": [
          {
            "mn": "Захиалагч болон Мэргэжилтэн эхлээд захиалгын чат, хүргэлт, засварын бүртгэлд тулгуурлан харилцан ойлголцохыг эрмэлзэнэ. Шаардлагатай бол админд зөрчлийг мэдэгдэнэ.",
            "en": "Buyers and Sellers should first use order messages, delivery records and revision notes to clarify disagreements. Material concerns can be raised with the beta administrator."
          },
          {
            "mn": "Одоогийн платформ санхүүгийн эскроу арбитр, албан ёсны төлбөр буцаалтын систем ажиллуулахгүй.",
            "en": "The current platform does not provide financial escrow arbitration or a payment-refund mechanism."
          }
        ],
        "bullets": []
      },
      {
        "id": "privacy-link",
        "title": {
          "mn": "11. Хувийн мэдээлэл",
          "en": "11. Personal data"
        },
        "paragraphs": [
          {
            "mn": "Хувийн мэдээлэлтэй холбоотой тайлбарыг Нууцлалын бодлого хэсгээс уншина уу. Нийтэд харагдах профайл нь мэргэжилтний сонгосон зөвшөөрлөөс хамаарна.",
            "en": "See the Privacy Policy for information about personal data. Public seller visibility depends on the freelancer's opt-in settings."
          }
        ],
        "bullets": []
      },
      {
        "id": "draft",
        "title": {
          "mn": "12. Баримт бичгийн хүчинтэй байдал",
          "en": "12. Publication and legal review"
        },
        "paragraphs": [
          {
            "mn": "Энэ нөхцөл нь бета туршилтын мэдээллийн төсөл. Операторын албан ёсны нэр, бүртгэлийн мэдээлэл, холбоо барих суваг, хүчин төгөлдөр болох огноо болон Монгол Улсын холбогдох эрх зүйн хяналтыг баталгаажуулсны дараа эцэслэнэ.",
            "en": "This is an informational beta draft. The operator's verified legal name, registration details, official contact, effective date and review under applicable Mongolian law must be completed before final publication as binding terms."
          }
        ],
        "bullets": []
      }
    ]
  },
  "privacy": {
    "label": {
      "mn": "НУУЦЛАЛЫН БОДЛОГО",
      "en": "PRIVACY POLICY"
    },
    "title": {
      "mn": "Таны мэдээлэл. Ил тод зарчим.",
      "en": "Privacy, explained clearly."
    },
    "subtitle": {
      "mn": "Бета хувилбарт ямар мэдээлэл боловсруулах, юунд ашиглах, хэн харах боломжтой талаар тайлбарлана.",
      "en": "An explanation of information processed by Linkup during beta, its intended uses and relevant access controls."
    },
    "review": true,
    "sections": [
      {
        "id": "scope",
        "title": {
          "mn": "1. Хамрах хүрээ ба хариуцагч",
          "en": "1. Scope and operator"
        },
        "paragraphs": [
          {
            "mn": "Энэ баримт бичиг Linkup-ын хэрэглэгчийн бүртгэл, профайл, үйлчилгээ, чат, захиалга болон бета туршилтын өгөгдөлд хамаарна.",
            "en": "This notice covers account registration, profiles, listings, messages, orders and related beta data."
          },
          {
            "mn": "Хувийн мэдээлэл хариуцагч байгууллагын албан ёсны нэр, хаяг, нууцлалын холбоо барих суваг албан ёсоор батлагдаагүй тул эцсийн хувилбарт заавал нэмж нийтэлнэ.",
            "en": "The legal operator's verified identity, address and dedicated privacy contact are not yet finalized and must be added to the approved policy."
          }
        ],
        "bullets": []
      },
      {
        "id": "collected",
        "title": {
          "mn": "2. Боловсруулж болох мэдээлэл",
          "en": "2. Categories of data"
        },
        "paragraphs": [
          {
            "mn": "Имэйл, баталгаажуулалтын төлөв, хэрэглэгчийн ID болон нэвтрэлтийн төлөв; таны оруулсан нэр, танилцуулга, бүтээлүүд, үйлчилгээний мэдээлэл; захиалгын шаардлага, мессеж, хүргэлтийн файлын холбоос ба төлөв; урилгын/админ аудитын бичлэг зэрэг өгөгдөл хадгалагдаж болно.",
            "en": "Data may include email, verification state, user identifiers and session details; profile names, descriptions, portfolios and listings; order briefs, messages, deliverable references and status; referral and administrative audit records."
          },
          {
            "mn": "Нууц үгийг энгийн текстээр сайт дээр харуулах ёсгүй; хэрэглэгчийн баталгаажуулалтыг Supabase Auth гүйцэтгэдэг.",
            "en": "Passwords must not be displayed as plain text by the website; authentication is handled through Supabase Auth."
          }
        ],
        "bullets": []
      },
      {
        "id": "purpose",
        "title": {
          "mn": "3. Хэрэглэх зорилго",
          "en": "3. Why data is used"
        },
        "paragraphs": [
          {
            "mn": "Бүртгэл баталгаажуулах, нээлттэй бета гишүүний эрх болон хандалтын хязгаарлалт шалгах, мэргэжилтнүүдийг хайлтад харуулах, чат/захиалга ажиллуулах, аюулгүй байдал хамгаалах, алдаа шалгах, үйлчилгээний чанарыг сайжруулахад ашиглана.",
            "en": "Information supports account verification, open-beta member access checks, opted-in freelancer discovery, messaging and order functionality, safety, troubleshooting and product improvement."
          }
        ],
        "bullets": []
      },
      {
        "id": "public",
        "title": {
          "mn": "4. Нийтэд харагдах мэдээлэл",
          "en": "4. Public profile choices"
        },
        "paragraphs": [
          {
            "mn": "Мэргэжилтэн «Профайлаа нийтэд нээх» сонголтыг идэвхжүүлээгүй үед хувийн бүтээлүүд, танилцуулгыг нээлттэй каталогоор харуулахгүй байхаар зохион байгуулсан. Нийтлэх зөвшөөрөлтэй мэргэжилтний нэр, танилцуулга болон нийтлэгдсэн үйлчилгээ каталогт орж болно.",
            "en": "Freelancer public discovery is designed to depend on explicit profile opt-in. When enabled, profile name, headline and published listing details may become visible in the marketplace."
          },
          {
            "mn": "Мессеж, захиалгын шаардлага болон хүргэлтийн мэдээлэл нь холбогдох захиалагч/мэргэжилтэн болон эрх бүхий админд хязгаарлагдахаар хамгаалагдана.",
            "en": "Messages, order briefs and delivery records are intended to be accessible only to participants and properly authorized administrators."
          }
        ],
        "bullets": []
      },
      {
        "id": "storage",
        "title": {
          "mn": "5. Технологийн үйлчилгээ үзүүлэгчид",
          "en": "5. Infrastructure and service providers"
        },
        "paragraphs": [
          {
            "mn": "Одоогийн систем нэвтрэлт, өгөгдлийн сан, файл хадгалахад Supabase, туршилтын сайтыг ажиллуулахад Cloudflare ашигладаг. Supabase төсөл Сингапур бүсэд байрлах тул мэдээлэл Монгол Улсаас гадна боловсруулагдах боломжтой.",
            "en": "The current system uses Supabase for authentication, database and storage and Cloudflare for preview delivery. The Supabase project is hosted in Singapore, so data may be processed outside Mongolia."
          },
          {
            "mn": "Ирээдүйд нэмэгдэх үйлчилгээ үзүүлэгч болон тэдгээрийн үүргийг нууцлалын баталгаажсан бодлогод шинэчилнэ.",
            "en": "Any future providers and their roles should be disclosed in the finalized notice."
          }
        ],
        "bullets": []
      },
      {
        "id": "cookies",
        "title": {
          "mn": "6. Күүки ба төхөөрөмжийн тохиргоо",
          "en": "6. Cookies and local preferences"
        },
        "paragraphs": [
          {
            "mn": "Нэвтрэлтийн төлөвийг хадгалах күүки болон хэл, өнгөний горим, хадгалсан үйлчилгээ зэрэг хөтчид үлдэх мэдээллийг ашиглаж болно. Дэлгэрэнгүйг «Күүки ашиглах бодлого» хэсгээс уншина уу.",
            "en": "The application may use session cookies and locally stored preferences such as language, theme and saved services. See the Cookie Policy for further detail."
          }
        ],
        "bullets": []
      },
      {
        "id": "retention",
        "title": {
          "mn": "7. Хадгалах хугацаа",
          "en": "7. Retention"
        },
        "paragraphs": [
          {
            "mn": "Бета хувилбарын бүх өгөгдөлд хамаарах эцсийн хадгалах хугацааны хүснэгт одоогоор нийтлэгдээгүй. Эцсийн бодлогод төрөл тус бүрийн хугацаа, устгах болон нөөц хуулбараас цэвэрлэх явцыг тогтоож нийтэлнэ.",
            "en": "A finalized per-category retention schedule has not yet been published for beta data. The approved policy must specify retention periods and deletion/backup handling."
          },
          {
            "mn": "Бета системд өгөгдөл байршуулахдаа шаардлагагүй нууц, санхүүгийн болон эмзэг мэдээлэл оруулахгүй байхыг зөвлөж байна.",
            "en": "Avoid submitting unnecessary secrets, financial credentials or sensitive personal information in the beta."
          }
        ],
        "bullets": []
      },
      {
        "id": "security",
        "title": {
          "mn": "8. Мэдээллийн аюулгүй байдал",
          "en": "8. Security safeguards"
        },
        "paragraphs": [
          {
            "mn": "RLS болон хэрэглэгчийн үүрэг, эзэмшигчийн шалгалтаар үйлчилгээ, чат, захиалгын хандалтыг хязгаарлах арга ашиглаж байна. Ямар ч интернэт систем эрсдэлийг бүрэн арилгана гэж батлах боломжгүй.",
            "en": "Role-based access checks and database row-level security help limit access to listings, conversations and orders. No internet service can guarantee zero security risk."
          }
        ],
        "bullets": []
      },
      {
        "id": "rights",
        "title": {
          "mn": "9. Хэрэглэгчийн хүсэлт, эрх",
          "en": "9. Privacy requests"
        },
        "paragraphs": [
          {
            "mn": "Өөрийн профайлын мэдээллийг засах, нийтэд харуулах сонголтоо өөрчлөх боломжийг бүтээгдэхүүнээр олгодог. Мэдээлэлд хандах, засварлах, устгуулах зэрэг нэмэлт хүсэлтийн албан ёсны сувгийг оператор эцэслэн тогтооно.",
            "en": "Users can edit profile information and change public-profile visibility in the product. The operator must finalize a verified contact channel and process for further access, correction and deletion requests."
          },
          {
            "mn": "Нэвтрэх боломжгүй үед хэрэглэгч туршилтын хувилбарын админтай өмнө тохиролцсон сувгаар холбогдоно; энэ сайт баталгаажаагүй имэйл хаягийг дэмжлэгийн хаяг мэт нийтлэхгүй.",
            "en": "If sign-in is unavailable, contact the existing beta administrator through a previously verified channel; this website will not invent an unverified support email."
          }
        ],
        "bullets": []
      },
      {
        "id": "children",
        "title": {
          "mn": "10. Хүүхдийн мэдээлэл",
          "en": "10. Children"
        },
        "paragraphs": [
          {
            "mn": "Бета хувилбар нь бие даасан мэргэжилтний үйлчилгээ, төсөлд зориулагдсан. Насны шаардлага, эцэг эхийн зөвшөөрлийн журмыг оператор тусад нь баталгаажуулж нийтэлнэ.",
            "en": "The beta is designed for freelance services and projects. Any minimum age and parental-consent requirements need operator and legal review before final publication."
          }
        ],
        "bullets": []
      },
      {
        "id": "changes",
        "title": {
          "mn": "11. Өөрчлөлт",
          "en": "11. Updates"
        },
        "paragraphs": [
          {
            "mn": "Энэхүү төсөлд өөрчлөлт орж болно. Эцсийн бодлогын огноо, өөрчлөлтийн түүх, операторын албан ёсны мэдээллийг нийтлэхээс өмнө баталгаажуулна.",
            "en": "This draft may change. Effective dates, change history and verified operator information must be confirmed before publication as a final policy."
          }
        ],
        "bullets": []
      }
    ]
  },
  "cookies": {
    "label": {
      "mn": "КҮҮКИ АШИГЛАХ БОДЛОГО",
      "en": "COOKIE POLICY"
    },
    "title": {
      "mn": "Жижиг тохиргоо, тодорхой мэдээлэл.",
      "en": "A clearer view of browser storage."
    },
    "subtitle": {
      "mn": "Нэвтрэлт болон таны сонголтыг хадгалахад ашигладаг күүки, хөтчийн дотоод хадгалалтын тухай.",
      "en": "How cookies and browser storage support sign-in and preferences."
    },
    "review": true,
    "sections": [
      {
        "id": "necessary",
        "title": {
          "mn": "1. Нэвтрэлтийн төлөв",
          "en": "1. Necessary session data"
        },
        "paragraphs": [
          {
            "mn": "Нэвтрэлтийн күүки нь бүртгэлийг баталгаажуулж, хэрэглэгчийн ажлын орчинд нэвтрэхэд хэрэгтэй. Хөтчийн тохиргоонд күүкиг хоригловол нэвтрэх боломжгүй болж болзошгүй.",
            "en": "Session cookies support sign-in and authenticated workspaces. Blocking necessary cookies may prevent access."
          }
        ],
        "bullets": []
      },
      {
        "id": "preferences",
        "title": {
          "mn": "2. Хэрэглэгчийн сонголт",
          "en": "2. Preferences"
        },
        "paragraphs": [
          {
            "mn": "Сайт хэлний сонголт, цайвар эсвэл бараан горим, хадгалсан жишиг үйлчилгээг хөтчийн дотоод хадгалалтад хадгалж болно.",
            "en": "Current website code may store selected language, dark/light theme and saved sample services in browser localStorage."
          }
        ],
        "bullets": []
      },
      {
        "id": "analytics",
        "title": {
          "mn": "3. Аналитик ба маркетингийн технологи",
          "en": "3. Analytics and marketing"
        },
        "paragraphs": [
          {
            "mn": "Аналитик/сурталчилгааны бүх үйлчилгээний аудит хараахан бүрэн хийгдээгүй тул гуравдагч этгээдийн хэрэглээг мөрдөх технологи огт байхгүй гэж батлахгүй. Ийм үйлчилгээ нэмэхэд бодлого болон шаардлагатай зөвшөөрлийн механизмыг шинэчилнэ.",
            "en": "A full inventory of analytics/marketing technologies has not been completed, so this draft does not make an absolute 'no tracking' claim. Any future integrations require an updated notice and any necessary consent controls."
          }
        ],
        "bullets": []
      },
      {
        "id": "control",
        "title": {
          "mn": "4. Таны сонголт",
          "en": "4. Your controls"
        },
        "paragraphs": [
          {
            "mn": "Хөтчийн тохиргооноос күүки болон хадгалсан мэдээллийг устгаж болно. Ингэснээр бүртгэлээс гарч, хэл болон өнгөний горим анхны тохиргоонд шилжиж болзошгүй.",
            "en": "Browsers allow you to clear cookies and stored data. Doing so may sign you out or reset language and theme preferences."
          }
        ],
        "bullets": []
      }
    ]
  },
  "buyers": {
    "label": {
      "mn": "ЗАХИАЛАГЧИЙН ГАРЫН АВЛАГА",
      "en": "BUYER GUIDE"
    },
    "title": {
      "mn": "Сайн төслийн эхлэл — зөв хүн.",
      "en": "A better way to hire creative talent."
    },
    "subtitle": {
      "mn": "Үйлчилгээ хайхаас эхлээд ажил хүлээн авах хүртэлх үндсэн алхмууд.",
      "en": "From discovery to collaboration, here's how the beta workflow works."
    },
    "sections": [
      {
        "id": "discover",
        "title": {
          "mn": "1. Үйлчилгээ хайх",
          "en": "1. Find a service"
        },
        "paragraphs": [
          {
            "mn": "Нүүр хуудасны хайлт эсвэл ангиллаас эхэл. Кирилл, латин галиг эсвэл англи үгээр хайж, нийтлэгдсэн үйлчилгээний нэр, тайлбар, мэргэжилтнийг харьцуул.",
            "en": "Start with the homepage search or categories. Search using Mongolian, romanized Mongolian or English, then compare published service descriptions and sellers."
          },
          {
            "mn": "Жишиг/demo картууд нь бодит мэргэжилтний захиалга биш. Зөвхөн бодит нийтлэгдсэн зар дээр холбогдох боломжтой.",
            "en": "Illustrative sample cards are not live seller offers. Contact actions are intended for real published listings."
          }
        ],
        "bullets": []
      },
      {
        "id": "packages",
        "title": {
          "mn": "2. Суурь / Стандарт / Дээд",
          "en": "2. Compare packages"
        },
        "paragraphs": [
          {
            "mn": "Багцын үнэ (₮), гүйцэтгэх хугацаа, засварын тоо, багтах ажлыг харьцуулаарай. Илүү үнэтэй багц таны төсөлд заавал илүү тохирно гэсэн үг биш.",
            "en": "Compare each tier's MNT price, delivery days, revision count and deliverables. A higher-priced package is not necessarily the best fit."
          },
          {
            "mn": "Захиалга үүсэхэд сонгосон багцын нөхцөл тухайн захиалгад хадгалагдана.",
            "en": "Selected package details are recorded as an order snapshot when a request is created."
          }
        ],
        "bullets": []
      },
      {
        "id": "contact",
        "title": {
          "mn": "3. Холбогдох ба бүртгүүлэх",
          "en": "3. Contact and sign in"
        },
        "paragraphs": [
          {
            "mn": "Үйлчилгээний хуудасны “Мессеж бичих” товчийг дараарай. Нэвтрээгүй бол эхлээд нэвтэрнэ. Дараа нь сонгосон мэргэжилтэнтэйгээ чатлах боломжтой.",
            "en": "Use Contact Seller to start a conversation. If not signed in, you are guided through login/sign-up with the selected seller carried forward."
          },
          {
            "mn": "Имэйл нь баталгаажсан, идэвхтэй бүртгэл шаардлагатай. Өөрийн мэргэжилтэн үйлчилгээ дээр өөртэйгөө чат эхлүүлэх боломжгүй.",
            "en": "An active, verified account is required. You cannot start a conversation with your own listing."
          }
        ],
        "bullets": []
      },
      {
        "id": "brief",
        "title": {
          "mn": "4. Төслийн шаардлага бичих",
          "en": "4. Write a useful brief"
        },
        "paragraphs": [
          {
            "mn": "Зорилго, хүссэн үр дүн, жишээ зураг/материал, файлын формат, хугацаа болон хүлээж буй ажлын хүрээг бич. Эмзэг мэдээлэл, төлбөрийн карт, нууц үг бүү хуваалц.",
            "en": "Share goals, expected output, references, desired file formats, timeline and scope. Never share passwords, card details or unnecessary sensitive data."
          }
        ],
        "bullets": []
      },
      {
        "id": "track",
        "title": {
          "mn": "5. Захиалгын явц",
          "en": "5. Track the request"
        },
        "paragraphs": [
          {
            "mn": "“Миний захиалга” хэсэгт Шинэ хүсэлт → Зөвшөөрсөн → Гүйцэтгэж байна → Хүлээлгэн өгсөн → Дууссан гэсэн явц харагдана. Ажлыг шалгаад хүлээн авах эсвэл багцын нөхцөлийн дагуу засвар хүсээрэй.",
            "en": "Track Requested → Accepted → In progress → Delivered → Completed in My Orders. Buyers can request eligible revisions or approve delivery."
          },
          {
            "mn": "Засвар хүсэх тоо сонгосон багцын хязгаараас хэтрэхгүй. Туршилтын хугацаанд төлбөр Linkup-аар дамжихгүй.",
            "en": "Revisions are limited by the selected package. No real money moves in the beta."
          }
        ],
        "bullets": []
      }
    ]
  },
  "freelancers": {
    "label": {
      "mn": "МЭРГЭЖИЛТНИЙ ГАРЫН АВЛАГА",
      "en": "FREELANCER GUIDE"
    },
    "title": {
      "mn": "Ур чадвараа ойлгомжтой үйлчилгээ болго.",
      "en": "Build a stronger freelance storefront."
    },
    "subtitle": {
      "mn": "Профайлаа бүрдүүлж, үйлчилгээгээ багцалж, захиалгын харилцааг удирдах алхмууд.",
      "en": "A practical guide to building your profile, packaging services and managing requests."
    },
    "sections": [
      {
        "id": "join",
        "title": {
          "mn": "1. Үйлчилгээ үзүүлэх",
          "en": "1. Join as a freelancer"
        },
        "paragraphs": [
          {
            "mn": "Нэг бүртгэлээр захиалагч, мэргэжилтний хоёр самбарыг ашиглаж болно. Имэйлээ баталгаажуулаад мэргэжилтний самбараас профайлаа бүрдүүлээрэй. Үйлчилгээг админ хянасны дараа нийтэлнэ.",
            "en": "You can use Buyer and Seller modes with one verified account. Set up your seller profile in Seller Studio; published services remain subject to moderation."
          }
        ],
        "bullets": []
      },
      {
        "id": "profile",
        "title": {
          "mn": "2. Профайл ба Бүтээлийн",
          "en": "2. Profile and portfolio"
        },
        "paragraphs": [
          {
            "mn": "Мэргэжил, туршлага, хийж чаддаг ажлаа товч танилцуулж, бүтээлийн жишээгээ нэмээрэй. Профайлын хаяг 3–60 тэмдэгттэй, жижиг латин үсэг, тоо, зураас агуулна.",
            "en": "Add a clear headline, specialty, relevant experience and portfolio examples. Public profile slugs use 3–60 lowercase Latin letters, digits or hyphens."
          },
          {
            "mn": "Профайлаа бусдад харуулахыг хүсвэл “Профайлаа нийтэд нээх” сонголтыг идэвхжүүлээрэй. Бусдын бүтээлийг зөвшөөрөлгүй ашиглаж болохгүй.",
            "en": "Enable public sharing only when you intend to appear in discovery. Use portfolio work you have permission to share."
          }
        ],
        "bullets": []
      },
      {
        "id": "create",
        "title": {
          "mn": "3. Үйлчилгээ ба гурван багц",
          "en": "3. Services and three tiers"
        },
        "paragraphs": [
          {
            "mn": "Үйлчилгээний нэр, ангилал, тайлбарыг товч бөгөөд хэмжигдэхүйц бич. Суурь, Стандарт, Дээд багц тус бүрд өөрийн үнэ, гүйцэтгэх хоног, засварын тоо, багтсан ажлуудаа бүрэн бөглө.",
            "en": "Give each service a clear title, category and scoped description. Define an authored price, delivery window, revision limit and inclusions for Basic, Standard and Premium."
          },
          {
            "mn": "Суурь багцын үнэ Стандартаас, Стандартын үнэ Дээд багцаас их байж болохгүй. Багц бүрийн үнийг өөрөө бөглөнө. Ноорог хадгалах эсвэл хянуулахаар илгээх боломжтой.",
            "en": "Prices must follow Basic ≤ Standard ≤ Premium. Standard and Premium for older services are not fabricated; you set them. Save as Draft or submit for moderation."
          }
        ],
        "bullets": []
      },
      {
        "id": "moderation",
        "title": {
          "mn": "4. Нийтлэх хүсэлт",
          "en": "4. Publishing and review"
        },
        "paragraphs": [
          {
            "mn": "Үйлчилгээг админ хянаж нийтэлнэ. Үйлчилгээ нийтлэгдсэн, профайл нийтэд нээлттэй үед үйлчилгээний жагсаалтад харагдана.",
            "en": "Listings may require moderation. Published listings tied to public opted-in seller profiles are shown in discovery."
          }
        ],
        "bullets": []
      },
      {
        "id": "orders",
        "title": {
          "mn": "5. Захиалгын удирдлага",
          "en": "5. Managing orders"
        },
        "paragraphs": [
          {
            "mn": "Шинэ хүсэлтийн шаардлага, сонгосон багцыг шалгаарай. Хүсэлтийг хүлээн авч, ажлаа эхлүүлнэ. Дуусмагц тайлбар, материалаа хавсаргаад “Хүлээлгэн өгөх” товчийг дараарай.",
            "en": "Review the brief and recorded package before accepting. Start work, provide deliverables and a delivery note, then mark the order Delivered."
          },
          {
            "mn": "Засвар хүсэлт ирвэл багцын хязгаарт багтаан гүйцэтгэх боломжийг тодруул. Бета хувилбарт платформ мөнгө шилжүүлэхгүй.",
            "en": "Coordinate revision requests within the package limit. The beta does not disburse money."
          }
        ],
        "bullets": []
      },
      {
        "id": "quality",
        "title": {
          "mn": "6. Мэргэжлийн стандарт",
          "en": "6. Professional habits"
        },
        "paragraphs": [
          {
            "mn": "Хугацаа, багтсан ажлыг урьдчилан тодорхой болго, харилцаанд хариу өг, файлын нөөц хадгал, ажил хүргэхдээ тайлбар бич. Өөрийн профайл дээр нотлогдоогүй рейтинг тавихгүй.",
            "en": "Set expectations clearly, respond to messages, maintain backups and explain each delivery. Do not claim unverifiable achievements or ratings."
          }
        ],
        "bullets": []
      }
    ]
  },
  "referrals": {
    "label": {
      "mn": "ТҮНШЛЭЛИЙН ХӨТӨЛБӨР",
      "en": "REFERRAL PARTNERS"
    },
    "title": {
      "mn": "Хамтын өсөлт, ойлгомжтой дүрэм.",
      "en": "Grow the community together."
    },
    "subtitle": {
      "mn": "Мэргэжилтнүүдийг танилцуулах түншлэлийн туршилтын бүтэц.",
      "en": "An overview of the beta referral partner model."
    },
    "sections": [
      {
        "id": "program",
        "title": {
          "mn": "Түншлэл ямар зорилготой вэ?",
          "en": "What is the program?"
        },
        "paragraphs": [
          {
            "mn": "Мэргэжилтнүүдийг Linkup-д урьж, үйлчилгээг нь шинэ захиалагчдад таниулах зорилготой. Түншийн бүртгэл, баталгаажуулалтыг админ хянана.",
            "en": "The program introduces qualified freelancers and helps more buyers discover services. Partner enrollment and verification are administered manually."
          }
        ],
        "bullets": []
      },
      {
        "id": "rules",
        "title": {
          "mn": "Одоогийн туршилтын тооцоолол",
          "en": "Current test calculation"
        },
        "paragraphs": [
          {
            "mn": "Туршилтын үндсэн тохиргоо: түншийн урамшуулал 1%, идэвхтэй түншийнх 2%, платформын шимтгэл 10%, урилга бүртгүүлэх хугацаа 30 хоног. Эдгээр тохиргоо өөрчлөгдөж болно.",
            "en": "Current configurable beta rules propose 1% standard partner, 2% active partner, a 10% platform commission and a 30-day attribution window. They may change."
          },
          {
            "mn": "Туршилтын тооцоолол нь мөнгөн урамшуулал авах эрх, төлбөрийн баталгаа болохгүй. Одоогоор мөнгөн урамшуулал олгохгүй.",
            "en": "These figures do not create a right to payment. No real partner cash reward is disbursed during beta."
          }
        ],
        "bullets": []
      },
      {
        "id": "join",
        "title": {
          "mn": "Хэрхэн оролцох вэ?",
          "en": "How to participate"
        },
        "paragraphs": [
          {
            "mn": "Бета эрхтэй бүртгэлээрээ нэвтэрч түншлэлийн хэсгийг үзнэ. Түншийн эрх/баталгаажуулалтыг админ шийдвэрлэнэ. Бусдын бүртгэл, захиалгын мэдээлэлд хандах эрх олгохгүй.",
            "en": "Approved beta users can review referral information in their workspace. Partner status requires administrator review and does not provide access to unrelated accounts or orders."
          }
        ],
        "bullets": []
      }
    ]
  }
};
export const helpTopics:{group:Localized;items:{q:Localized;a:Localized}[]}[]=[
  {
    "group": {
      "mn": "Бүртгэл ба нэвтрэлт",
      "en": "Accounts & access"
    },
    "items": [
      {
        "q": {
          "mn": "Linkup-д хэн бүртгүүлж болох вэ?",
          "en": "Who can sign up?"
        },
        "a": {
          "mn": "Linkup нээлттэй туршилтын хувилбартай. Хэн ч бүртгүүлж, имэйлээ баталгаажуулаад ашиглаж болно. Админы зөвшөөрөл шаардахгүй.",
          "en": "Linkup is in open beta. Anyone may sign up; email verification unlocks standard access without manual approval."
        }
      },
      {
        "q": {
          "mn": "Бүртгэлийн хандалт идэвхгүй байвал яах вэ?",
          "en": "What if my account access is unavailable?"
        },
        "a": {
          "mn": "Имэйлээ баталгаажуулсныхаа дараа нэвтэрч, эрхээ дахин шалгана уу. Хандалт идэвхгүй хэвээр байвал бүртгэл хязгаарлагдсан эсэхийг админаас лавлана уу.",
          "en": "After verifying your email, sign in and check access again. If you are still blocked, contact the administrator to review possible account restrictions."
        }
      },
      {
        "q": {
          "mn": "Имэйл баталгаажуулах захиа ирээгүй бол яах вэ?",
          "en": "What if I never receive a confirmation email?"
        },
        "a": {
          "mn": "Ирсэн имэйл болон Спам хавтсаа шалгаарай. Өмнө бүртгүүлсэн бол “Нэвтрэх” сонголтыг ашиглаарай. Имэйл ирэхгүй хэвээр байвал админтай холбогдоорой.",
          "en": "Check Inbox and Spam. If already registered, use Sign in rather than signing up again. An accepted send request does not guarantee delivery; admins should check SMTP for new-email delivery issues."
        }
      },
      {
        "q": {
          "mn": "Нууц үгээ мартсан бол?",
          "en": "I forgot my password. What now?"
        },
        "a": {
          "mn": "Нэвтрэх хуудсан дээрх “Нууц үгээ мартсан уу?” холбоосоор орж сэргээх холбоос хүсээрэй.",
          "en": "Use Sign in → Forgot password to request a reset link. Delivery depends on email configuration."
        }
      },
      {
        "q": {
          "mn": "Нэг бүртгэлээр мэргэжилтэн ба захиалагч байж болох уу?",
          "en": "Can I be both Buyer and Seller?"
        },
        "a": {
          "mn": "Тийм. Нэг бүртгэлээс захиалагч, мэргэжилтний самбар руу шилжиж болно. Өөртэйгөө чатлах, өөрийн үйлчилгээг захиалах боломжгүй.",
          "en": "Yes. One account can use Buyer Dashboard and Seller Studio. It cannot start a buyer conversation with its own listing."
        }
      }
    ]
  },
  {
    "group": {
      "mn": "Үйлчилгээ ба үнийн багц",
      "en": "Services & packages"
    },
    "items": [
      {
        "q": {
          "mn": "Суурь, Стандарт, Дээд багц юугаараа ялгаатай вэ?",
          "en": "What are Basic, Standard and Premium?"
        },
        "a": {
          "mn": "Мэргэжилтний тодорхойлдог гурван сонголт. Тус бүр өөр үнэ, хугацаа, засварын тоо, багтсан ажлуудтай.",
          "en": "Three seller-authored offer tiers, each with its own price, delivery timeline, revision limit and inclusions."
        }
      },
      {
        "q": {
          "mn": "Харсан бүх зар бодит үйлчилгээ юу?",
          "en": "Are all listed designs real services?"
        },
        "a": {
          "mn": "Жишиг гэж тэмдэглэсэн картууд нь загвар танилцуулах зориулалттай. Захиалга өгөхдөө нийтлэгдсэн үйлчилгээний хуудаснаас багцаа сонгоорой.",
          "en": "No. Some visual cards are demo concepts. Actual services appear in the live published marketplace and support Contact Seller."
        }
      },
      {
        "q": {
          "mn": "Үйлчилгээний үнэ өөрчлөгдвөл захиалгад нөлөөлөх үү?",
          "en": "What if a freelancer changes a package price?"
        },
        "a": {
          "mn": "Захиалга үүссэн үеийн багцын үнэ, хугацаа, засварын нөхцөл тухайн захиалгад хадгалагдана; дараах шинэ үнэ автоматаар солихгүй.",
          "en": "The order stores selected package conditions at request time. Later listing changes do not automatically overwrite an existing order."
        }
      },
      {
        "q": {
          "mn": "Мэргэжилтэн зар хэрхэн нийтлэх вэ?",
          "en": "How do freelancers publish?"
        },
        "a": {
          "mn": "Мэргэжилтний самбарт профайл, үйлчилгээ, гурван багцаа бөглөөрэй. Ноорог хадгалах эсвэл админд хянуулахаар илгээж болно. Профайлаа нийтэд нээсэн байх шаардлагатай.",
          "en": "Configure the seller profile and three tiers in Seller Studio. Save a draft or submit for review. Public discovery also requires seller opt-in."
        }
      }
    ]
  },
  {
    "group": {
      "mn": "Чат ба захиалга",
      "en": "Messaging & orders"
    },
    "items": [
      {
        "q": {
          "mn": "Мэргэжилтэнтэй яаж холбогдох вэ?",
          "en": "How do I contact a freelancer?"
        },
        "a": {
          "mn": "Нийтлэгдсэн үйлчилгээний хуудаснаас “Мессеж бичих” товчийг дараарай. Нэвтрээгүй бол нэвтэрсний дараа тухайн мэргэжилтний чат нээгдэнэ.",
          "en": "Choose Contact Seller on a published listing. Sign in if required and continue to the selected seller's conversation."
        }
      },
      {
        "q": {
          "mn": "Захиалгын ямар төлөвүүд байдаг вэ?",
          "en": "What are the order stages?"
        },
        "a": {
          "mn": "Шинэ хүсэлт, Зөвшөөрсөн, Гүйцэтгэж байна, Хүлээлгэн өгсөн, Дууссан гэсэн үндсэн төлөвтэй. Явцаас нь хамаарч хүсэлтийг цуцлах, татгалзах, засвар хүсэх боломжтой.",
          "en": "Core stages include Requested, Accepted, In progress, Delivered and Completed, with supported cancel/reject/revision paths."
        }
      },
      {
        "q": {
          "mn": "Засварыг хэдэн удаа хүсэж болох вэ?",
          "en": "How many revisions can I request?"
        },
        "a": {
          "mn": "Сонгосон багцад заасан тоогоор засвар хүсэж болно. Юуг хэрхэн засуулахыг тодорхой бичээрэй.",
          "en": "Requests are limited by the selected package's revision allowance. Be specific about the change required."
        }
      },
      {
        "q": {
          "mn": "Бодит мөнгө төлөх хэрэгтэй юу?",
          "en": "Do I pay real money during beta?"
        },
        "a": {
          "mn": "Үгүй. Одоогийн нээлттэй бета хувилбарт банк, QPay, эскроу болон төлбөрийн гүйлгээ идэвхгүй. Үнэ нь захиалгын туршилтын мэдээлэл.",
          "en": "No. Banking, QPay, escrow and real money transactions are not active in the current open beta. Displayed prices support order testing."
        }
      }
    ]
  },
  {
    "group": {
      "mn": "Нууцлал ба аюулгүй байдал",
      "en": "Privacy & safety"
    },
    "items": [
      {
        "q": {
          "mn": "Миний чат бусдад харагдах уу?",
          "en": "Are my messages public?"
        },
        "a": {
          "mn": "Мессеж, захиалгын мэдээллийг зөвхөн холбогдох талууд болон эрх бүхий админ харах боломжтой байхаар хамгаалсан. Нууц үг, төлбөрийн нууц мэдээллээ чатаар бүү илгээгээрэй.",
          "en": "Messages and orders use row-level security and authorization intended to limit access to participants and approved administrators. Avoid sending sensitive secrets."
        }
      },
      {
        "q": {
          "mn": "Миний мэргэжилтний профайл нийтэд харагдах уу?",
          "en": "Is my seller profile public?"
        },
        "a": {
          "mn": "“Профайлаа нийтэд нээх” тохиргоо, профайлын хаяг, нийтлэгдсэн үйлчилгээнээс хамаарна. Профайлаа нийтэд харуулахыг хүсэхгүй бол уг тохиргоог идэвхжүүлэх шаардлагагүй.",
          "en": "Visibility depends on public-profile opt-in, a valid slug and published services. You do not have to enable public sharing."
        }
      },
      {
        "q": {
          "mn": "Хуурамч зар эсвэл зохисгүй агуулга олбол?",
          "en": "What if a listing looks misleading?"
        },
        "a": {
          "mn": "Хэрэглэгчтэй хувийн мэдээлэл, төлбөрийн нууц мэдээлэл бүү хуваалц. Баталгаажсан бета админд тухайн үйлчилгээний холбоос болон асуудлын тайлбарыг дамжуул.",
          "en": "Do not share private credentials or payment data. Escalate the listing URL and relevant details to the verified beta administrator."
        }
      }
    ]
  },
  {
    "group": {
      "mn": "Түншлэл ба тусламж",
      "en": "Referrals & support"
    },
    "items": [
      {
        "q": {
          "mn": "Түншийн 1%, 2%-ийн урамшууллыг мөнгөөр олгох уу?",
          "en": "Are the 1% and 2% referral rewards paid?"
        },
        "a": {
          "mn": "Одоогоор олгохгүй. Эдгээр хувь нь туршилтын тооцооллын тохиргоо юм. Мөнгөн урамшуулал олгож эхлэхээс өмнө нөхцөлийг тусад нь нийтэлнэ.",
          "en": "Not yet. These are configurable beta calculations. Real payouts would require a separate approved policy and payment system."
        }
      },
      {
        "q": {
          "mn": "Албан ёсны тусламжийн имэйл бий юу?",
          "en": "Is an official support email available?"
        },
        "a": {
          "mn": "Албан ёсны тусламжийн имэйл хараахан нийтлэгдээгүй байна. Админтай өмнө ашиглаж байсан баталгаатай сувгаараа холбогдоорой.",
          "en": "No verified official support mailbox has been published. Contact the platform administrator through an existing trusted channel."
        }
      },
      {
        "q": {
          "mn": "Төлбөр ба эскроу хэзээ нээгдэх вэ?",
          "en": "When will payments and escrow launch?"
        },
        "a": {
          "mn": "Эхлэх хугацаа хараахан зарлаагүй. Эдгээр боломж хөгжүүлэлтийн төлөвлөгөөнд байгаа бөгөөд туршилтын хувилбарт ажиллахгүй.",
          "en": "No confirmed launch date has been announced. These are roadmap features and are not active in beta."
        }
      }
    ]
  }
];
