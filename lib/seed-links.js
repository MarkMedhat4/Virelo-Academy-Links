// Initial links, written to the database once (first request after deployment).
// The first three are the official Virelo Academy system links; the rest are the links that
// already existed on the public page (URLs unchanged), placed after them.
import { randomUUID } from 'node:crypto';

const BASE = 'https://virelo-academy-system.vercel.app';

const SEEDS = [
  {
    title: 'Official Virelo Academy Website', description: 'Visit the official Virelo Academy website',
    url: BASE, icon: 'website', category: 'Platform', featured: true, enabled: true, order: 1,
    translations: { ar: { title: 'الموقع الرسمي لفيريلو أكاديمي', description: 'زيارة الموقع الرسمي لفيريلو أكاديمي' } }
  },
  {
    title: 'تسجيل البيانات',
    description: 'تسجيل البيانات لأول مرة — الاسم الرباعي، رقم الطالب، اسم ورقم ولي الأمر، والصف الدراسي.',
    url: `${BASE}/register`, icon: 'registration', category: 'Registration', featured: true, enabled: true, order: 2,
    translations: { en: { title: 'Student Registration', description: 'First-time registration — full four-part name, student number, parent name and phone number, and grade.' } }
  },
  {
    title: 'دفع الحصة',
    description: 'إدخال بيانات التحويل وإرفاق صورة إثبات الدفع بوضوح بعد كل دفعة.',
    url: `${BASE}/payment`, icon: 'payment', category: 'Payment', featured: true, enabled: true, order: 3,
    translations: { en: { title: 'Lesson Payment', description: 'Enter the transfer details and attach a clear proof-of-payment image after every payment.' } }
  },
  {
    title: 'Instagram', description: 'Follow Virelo Academy on Instagram', url: 'https://www.instagram.com/vireloacademy',
    icon: 'instagram', category: 'Social', featured: false, enabled: true, order: 4,
    translations: { ar: { title: 'إنستجرام', description: 'تابع فيريلو أكاديمي على إنستجرام' } }
  },
  {
    title: 'Facebook', description: 'Follow Virelo Academy on Facebook', url: 'https://www.facebook.com/share/1FMkL8Cs1s/',
    icon: 'facebook', category: 'Social', featured: false, enabled: true, order: 5,
    translations: { ar: { title: 'فيسبوك', description: 'تابع فيريلو أكاديمي على فيسبوك' } }
  },
  {
    title: 'WhatsApp', description: 'Contact Virelo Academy', url: 'https://wa.me/201552481349',
    icon: 'whatsapp', category: 'Contact', featured: true, enabled: true, order: 6,
    translations: { ar: { title: 'واتساب', description: 'تواصل مع فيريلو أكاديمي' } }
  },
  {
    title: 'TikTok', description: 'Follow Virelo Academy on TikTok', url: 'https://www.tiktok.com/@virelo%20academy',
    icon: 'tiktok', category: 'Social', featured: false, enabled: true, order: 7,
    translations: { ar: { title: 'تيك توك', description: 'تابع فيريلو أكاديمي على تيك توك' } }
  },
  {
    title: 'WhatsApp Community', description: 'Join the Virelo Academy Community', url: 'https://chat.whatsapp.com/LbEhhtC45dN4zlIcaLvaI0',
    icon: 'community', category: 'Community', featured: true, enabled: true, order: 8,
    translations: { ar: { title: 'مجتمع واتساب', description: 'انضم إلى مجتمع فيريلو أكاديمي' } }
  },
  {
    title: 'WhatsApp Channel', description: 'Follow Virelo Academy Channel', url: 'https://whatsapp.com/channel/0029VbCox3ZGpLHVfGr62r3U',
    icon: 'channel', category: 'Community', featured: false, enabled: true, order: 9,
    translations: { ar: { title: 'قناة واتساب', description: 'تابع قناة فيريلو أكاديمي' } }
  }
];

export function buildSeedLinks(now = new Date()) {
  return SEEDS.map((seed, i) => {
    const stamp = new Date(now.getTime() + i).toISOString();
    return { id: randomUUID(), ...seed, createdAt: stamp, updatedAt: stamp };
  });
}
