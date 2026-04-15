export interface BlogPost {
  slug: string;
  title: {
    ar: string;
    en: string;
  };
  description: {
    ar: string;
    en: string;
  };
  content: {
    ar: string;
    en: string;
  };
  coverImage: string;
  date: string;
}

export const blogData: BlogPost[] = [
  {
    slug: "lateness-affects-team-performance",
    title: {
      ar: "التأخر يؤثر على أداء فريقك",
      en: "Lateness affects your team's performance",
    },
    description: {
      ar: "لا تدع التأخيرات تؤثر على أداء فريقك. اعرف كيف تضع التوقعات.",
      en: "Don't let delays affect your team's performance. Learn how to set expectations.",
    },
    content: {
      ar: `<p>التأخر المستمر لا يؤثر فقط على إنتاجية الفرد، بل يمتد تأثيره ليطال الروح المعنوية للفريق بأكمله. عندما يعتاد الموظفون على تجاهل مواعيد العمل، ينخفض الالتزام العام وتشعر بقية أعضاء الفريق الذين يلتزمون بالمواعيد بالإحباط.</p>
           <br/><p>أظهرت الدراسات الحديثة أن التأخيرات المتكررة غير المدارة يمكن أن تكلف الشركات آلاف الدولارات سنوياً بسبب الوقت الضائع وانخفاض كفاءة العمل. بالإضافة إلى ذلك، فإنه يؤثر سلبًا على تقديم الخدمات ويقلل من رضا العملاء عندما يتأخر تسليم المشاريع عن الجدول الزمني.</p>
           <br/><h3>كيف تضع التوقعات؟</h3>
           <p>الخطوة الأولى هي وضع سياسة حضور وانصراف واضحة وشفافة. يجب أن يكون كل موظف على دراية تامة بمواعيد العمل، وفترة السماح المتاحة (إن وجدت)، وعواقب عدم الالتزام.</p>
           <br/><p>في هذا المقال نناقش أفضل الاستراتيجيات للتعامل مع التأخير وكيف يمكنك استخدام أدواتنا في منصة "يومي" لتتبع هذه الحالات بشكل آلي وتقليل التأخيرات بصورة فعالة ومنصفة للجميع.</p>`,
      en: `<p>Constant lateness doesn't just affect individual productivity; it impacts the entire team's morale. When employees make a habit of ignoring schedules, overall commitment drops, and punctual team members begin to feel frustrated.</p>
           <br/><p>Recent studies have shown that unmanaged recurring delays can cost companies thousands of dollars annually due to lost time and decreased work efficiency. Furthermore, it negatively impacts service delivery and reduces customer satisfaction when projects fall behind schedule.</p>
           <br/><h3>How to Set Expectations?</h3>
           <p>The first step is establishing a clear and transparent attendance policy. Every employee must be fully aware of working hours, available grace periods (if any), and the consequences of non-compliance.</p>
           <br/><p>In this article, we discuss the best strategies for dealing with lateness and how you can use Yawmy's tools to automatically track these cases, reducing delays effectively and fairly for everyone.</p>`,
    },
    coverImage: "https://images.unsplash.com/photo-1541746972996-4e0b0f43e02a?q=80&w=2000&auto=format&fit=crop",
    date: "2024-04-10",
  },
  {
    slug: "introducing-telegram-attendance",
    title: {
      ar: "نقدم لك تسجيل الحضور عبر تليجرام",
      en: "Introducing Attendance via Telegram",
    },
    description: {
      ar: "كيف يمكن للموظفين تسجيل حضورهم من تليجرام في أقل من 5 ثوانٍ.",
      en: "How employees can log their attendance via Telegram in under 5 seconds.",
    },
    content: {
      ar: `<p>إضافة أجهزة البصمة التقليدية والتعامل مع الكابلات والبرمجيات المعقدة أصبحت من الماضي. مع يومي، يمكن لموظفيك الآن تسجيل حضورهم وانصرافهم بمجرد إرسال موقعهم الجغرافي من خلال تطبيق تليجرام المألوف لديهم سلفًا.</p>
           <br/><p>لماذا تليجرام؟ تليجرام يوفر بنية تحتية سريعة للغاية، آمنة وموثوقة، وتسمح ببرمجة بوتات متقدمة يمكنها معالجة بيانات الموقع بدقة. هذا يعني أن الموظف لا يضطر إلى تنزيل تطبيق جديد مخصص لشركتك، بل يستخدم أداة موجودة بالفعل في هاتفه.</p>
           <br/><h3>هل هذا النظام دقيق وآمن؟</h3>
           <p>بكل تأكيد. هذا النظام لا يوفر فقط التكاليف الباهظة لأجهزة البصمة، بل يضمن دقة الموقع بفضل تقنيات تحديد المواقع المتقدمة. لا يمكن للموظف إرسال موقع مزيف بسهولة بفضل بروتوكولات التحقق لدينا. ابدأ اليوم بتوجيه فريقك نحو استخدام البوت الخاص بشركتك، وشاهد كيف توفر الكثير من الوقت والمجهود المهدورين سابقًا.</p>`,
      en: `<p>Installing traditional fingerprint devices, dealing with cables, and managing complex software is a thing of the past. With Yawmy, your employees can now log their attendance simply by sharing their geolocation through the familiar Telegram app.</p>
           <br/><p>Why Telegram? Telegram provides a blazing-fast, secure, and reliable infrastructure, enabling advanced bots that accurately process location data. This means employees don't have to download yet another app dedicated solely to your company; they just use a tool already on their phone.</p>
           <br/><h3>Is this system accurate and secure?</h3>
           <p>Absolutely. This system not only saves you the hefty costs of biometric hardware but also guarantees location accuracy via advanced geolocation techniques. Bypassing or spoofing locations is heavily mitigated by our validation protocols. Start directing your team to use your company's bot today, and watch how much time and effort you save.</p>`,
    },
    coverImage: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=2000&auto=format&fit=crop",
    date: "2024-04-12",
  },
  {
    slug: "set-shift-start-times",
    title: {
      ar: "اضبط مواعيد بدء الشيفت",
      en: "Set Shift Start Times",
    },
    description: {
      ar: "اضبط حد التأخر ليناسب سياسة شركتك.",
      en: "Adjust your lateness threshold to fit your company's policy.",
    },
    content: {
      ar: `<p>كل شركة لها سياسة مرونة مختلفة عندما يتعلق الأمر بمواعيد بدء العمل. بعض الشركات تفضل الدقة التامة وصولاً إلى الدقيقة الواحدة، بينما تعطي شركات أخرى فترة سماح مدتها 15 أو حتى 30 دقيقة مراعاةً لظروف المرور والازدحام الصباحي.</p>
           <br/><p>إن إجبار شركة تتمتع بثقافة مرنة على الالتزام بنظام صارم يمكن أن يؤدي إلى استياء الموظفين، والعكس صحيح.</p>
           <br/><h3>كيف نقوم بذلك في يومي؟</h3>
           <p>من خلال لوحة تحكم الإدارة في يومي، تمتلك القدرة الكاملة على توفيق النظام ليتماشى مع سياساتك المعتمدة. يمكنك بسهولة تعديل فترة السماح الخاصة ببداية الشيفت، وتطبيق خصومات آلية تتناسب تناسباً طردياً مع حجم التأخير بعد انتهاء تلك الفترة.</p>
           <br/><p>ندعوك للاستفادة الكاملة من هذه الإعدادات لخلق بيئة عمل عادلة توازن بين الانضباط والمرونة وتضمن أداء المهام دون تعطيل.</p>`,
      en: `<p>Every company has a different flexibility policy when it comes to shift start times. Some prefer strict adherence down to the exact minute, while others offer a 15- or even 30-minute grace period to account for morning traffic and unexpected commutes.</p>
           <br/><p>Forcing a company with a flexible culture into a rigid system can lead to employee dissatisfaction, and vice-versa.</p>
           <br/><h3>How do we handle it at Yawmy?</h3>
           <p>Through the Yawmy administration dashboard, you have full control to align the system with your established policies. You can easily adjust the shift-start grace period and apply proportional automatic deductions for any lateness exceeding that threshold.</p>
           <br/><p>We encourage you to take full advantage of these settings to create a fair workplace that balances discipline with flexibility, ensuring operations run smoothly without interruption.</p>`,
    },
    coverImage: "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?q=80&w=2000&auto=format&fit=crop",
    date: "2024-04-14",
  },
  {
    slug: "expand-without-overpaying",
    title: {
      ar: "كيف توسع فريقك دون دفع مبالغ زائدة",
      en: "How to Expand Your Team Without Overpaying",
    },
    description: {
      ar: "افهم كيف تعمل فواتيرنا القائمة على الاستخدام عند تجاوز حد الخطة.",
      en: "Understand how our usage-based billing works when exceeding plan limits.",
    },
    content: {
      ar: `<p>النمو شيء رائع ودليل على نجاح أعمالك، ولكن إدارة النفقات أثناء التوسع السريع غالباً ما يكون هو التحدي الحقيقي. الكثير من منصات ومقدمي خدمات الشركات تلزمك بدفع اشتراكات لخطط ضخمة بمجرد تجاوزك للحد الأقصى للموظفين بموظف واحد فقط، مما يضيع ميزانيتك على موارد غير مستغلة.</p>
           <br/><h3>تسعير ينمو معك</h3>
           <p>في يومي، قمنا بتصميم خطط الأسعار بفلسفة مختلفة تعتمد على المرونة والشفافية. إذا تجاوزت الحد المسموح به في خطتك الأساسية، فإن التسعير يتحول فوراً ليعتمد على الاستخدام الفردي لكل موظف نشط إضافي.</p>
           <br/><p>هذا النموذج الذكي يضمن لك أن تدفع فقط وبدقة مقابل ما تستخدمه حقاً، مما يجعل إضافة موظفين جُدد عملية سهلة ومدعومة، خالية من القلق المتعلق بالفواتير المفاجئة المكلفة. استثمر أموالك حيث يهم أمر شركتك أكثر!</p>`,
      en: `<p>Growth is a wonderful sign of success, but managing expenses during rapid expansion is often the real challenge. Many B2B platforms force you to upgrade to massively expensive plans just because you crossed your employee limit by one person, wasting your budget on unutilized resources.</p>
           <br/><h3>Pricing built to scale</h3>
           <p>At Yawmy, we've designed our pricing plans with a different philosophy: flexibility and transparency. If you exceed your base plan limit, pricing instantly switches to a per-additional-active-employee usage model.</p>
           <br/><p>This smart framework ensures you pay accurately and strictly for what you truly use. It makes onboarding new personnel a seamless, stress-free process without the fear of suddenly inflated bills. Invest your money where it actually matters most for your business!</p>`,
    },
    coverImage: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?q=80&w=2000&auto=format&fit=crop",
    date: "2024-04-15",
  },
];

import { supabase } from "@/lib/supabase";

export async function fetchBlogs(): Promise<BlogPost[]> {
   const { data, error } = await supabase.from('blog_posts').select('*').order('published_at', { ascending: false });
   if (error || !data) return [];
   return data.map(b => ({
     slug: b.slug,
     title: { ar: b.title_ar, en: b.title_en },
     description: { ar: b.description_ar, en: b.description_en },
     content: { ar: b.content_ar, en: b.content_en },
     coverImage: b.cover_image,
     date: b.published_at,
   }));
}
