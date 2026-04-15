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
      ar: "<p>التأخر المستمر لا يؤثر فقط على إنتاجية الفرد، بل يمتد تأثيره ليطال الروح المعنوية للفريق بأكمله. عندما يعتاد الموظفون على تجاهل مواعيد العمل، ينخفض الالتزام العام.</p><p>في هذا المقال نناقش أفضل الاستراتيجيات للتعامل مع التأخير وكيف يمكنك استخدام أدوات يومي لتتبع هذه الحالات بشكل آلي.</p>",
      en: "<p>Constant lateness doesn't just affect individual productivity; it impacts the entire team's morale. When employees make a habit of ignoring schedules, overall commitment drops.</p><p>In this article, we discuss the best strategies for dealing with lateness and how you can use Yawmy's tools to automatically track these cases.</p>",
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
      ar: "<p>إضافة أجهزة البصمة التقليدية أصبحت من الماضي. مع يومي، يمكن لموظفيك تسجيل حضورهم وانصرافهم بمجرد إرسال موقعهم عبر تليجرام.</p><p>هذا لا يوفر فقط تكلفة الأجهزة، بل يضمن دقة الموقع بفضل تقنيات تحديد المواقع المتقدمة التي نستخدمها. ابدأ اليوم بتوجيه فريقك نحو استخدام البوت الخاص بك.</p>",
      en: "<p>Traditional fingerprint devices are a thing of the past. With Yawmy, your employees can log their attendance simply by sharing their location via Telegram.</p><p>This not only saves device costs but also ensures location accuracy thanks to our advanced geolocation techniques. Start directing your team to use your bot today.</p>",
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
      ar: "<p>كل شركة لها سياسة مرونة مختلفة عندما يتعلق الأمر بمواعيد بدء العمل. بعض الشركات تفضل الدقة التامة، بينما تعطي شركات أخرى فترة سماح مدتها 15 دقيقة.</p><p>من خلال لوحة تحكم يومي، يمكنك بسهولة تعديل فترة السماح وتطبيق خصومات آلية على التأخيرات التي تتجاوز هذا الحد.</p>",
      en: "<p>Every company has a different flexibility policy when it comes to shift start times. Some prefer strict adherence, while others offer a 15-minute grace period.</p><p>Through the Yawmy dashboard, you can easily adjust the grace period and apply automatic deductions for lateness exceeding this threshold.</p>",
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
      ar: "<p>النمو شيء رائع، ولكن إدارة النفقات أثناء التوسع هو التحدي الحقيقي. في يومي، قمنا بتصميم خطط الأسعار لتتوسع معك.</p><p>إذا تجاوزت الحد المسموح به في خطتك الأساسية، فإن التسعير يعتمد الاستخدام لكل موظف نشط إضافي، مما يعني أنك تدفع فقط مقابل ما تستخدمه حقاً.</p>",
      en: "<p>Growth is great, but managing expenses while expanding is the real challenge. At Yawmy, we've designed our pricing plans to scale with you.</p><p>If you exceed your base plan limit, pricing becomes usage-based per additional active employee, meaning you only pay for what you actually use.</p>",
    },
    coverImage: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?q=80&w=2000&auto=format&fit=crop",
    date: "2024-04-15",
  },
];
