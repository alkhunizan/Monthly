import React, { useState, useEffect, useMemo, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, onSnapshot, doc, setDoc, query } from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';

// --- أيقونات SVG ---
const UserIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 ml-2 text-gray-500"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
);
const MapPinIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 ml-2 text-gray-500"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
);
const ClockIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 ml-2 text-gray-500"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
);
const SparklesIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 3L9.27 9.27L3 12l6.27 2.73L12 21l2.73-6.27L21 12l-6.27-2.73L12 3z"/><path d="M5 22L7 17"/><path d="M17 17l2 5"/></svg>
);
const ClipboardIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
);

// --- مكون بطاقة الشهر (MonthCard Component) ---
const MonthCard = ({ month, booking, onBook }) => {
    const isBooked = !!booking;
    return (
        <div className={`bg-white rounded-xl shadow-md p-5 flex flex-col justify-between transition-all duration-300 ${isBooked ? 'border-t-4 border-teal-500' : 'border-t-4 border-gray-200'}`}>
            <div>
                <h2 className="text-xl font-semibold text-teal-800 mb-4">{month.name}</h2>
                {isBooked ? (
                    <div className="space-y-3 text-sm">
                        <div className="flex items-center"><UserIcon /><span className="font-medium mr-2">المضيف:</span> {booking.host}</div>
                        <div className="flex items-center"><MapPinIcon /><span className="font-medium mr-2">المكان:</span> {booking.location}</div>
                        <div className="flex items-center"><ClockIcon /><span className="font-medium mr-2">اليوم:</span> يوم {booking.day} نهاية الشهر</div>
                    </div>
                ) : (<div className="text-center text-gray-500 py-4"><p>لم يُحجز بعد</p></div>)}
            </div>
            {!isBooked && (
                <button onClick={() => onBook(month.name)} className="mt-4 w-full bg-teal-600 text-white py-2 px-4 rounded-lg hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-opacity-50 transition-transform transform hover:scale-105">
                    حجز الدورية
                </button>
            )}
        </div>
    );
};

// --- مكون نافذة الحجز (BookingModal Component) ---
const BookingModal = ({ month, hosts, locations, onConfirmBooking, onClose, initialError }) => {
    const [host, setHost] = useState(hosts[0] || '');
    const [location, setLocation] = useState(locations[0] || '');
    // Default to Thursday. The previous value was misspelled which resulted in
    // neither option being selected when the modal opened.
    const [day, setDay] = useState('الخميس');
    const [error, setError] = useState(initialError);
    const handleSubmit = (e) => {
        e.preventDefault();
        if (!host) { setError('الرجاء اختيار المضيف.'); return; }
        onConfirmBooking({ month, host, location, day });
    };
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl p-6 sm:p-8 w-full max-w-md" dir="rtl">
                <h3 className="text-2xl font-bold text-teal-800 mb-2">حجز دورية شهر {month}</h3>
                <p className="text-gray-500 mb-6">الرجاء إكمال البيانات التالية لتأكيد الحجز.</p>
                <form onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="host" className="block text-sm font-medium text-gray-700 mb-1">اختر المضيف</label>
                            <select id="host" value={host} onChange={(e) => setHost(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-teal-500 focus:border-teal-500">{hosts.map(h => <option key={h} value={h}>{h}</option>)}</select>
                        </div>
                        <div>
                            <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">اختر المكان</label>
                            <select id="location" value={location} onChange={(e) => setLocation(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-teal-500 focus:border-teal-500">{locations.map(l => <option key={l} value={l}>{l}</option>)}</select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">اختر اليوم المناسب</label>
                            <div className="flex space-x-4 space-x-reverse">
                                <label className="flex items-center"><input type="radio" name="day" value="الخميس" checked={day === 'الخميس'} onChange={(e) => setDay(e.target.value)} className="ml-2 text-teal-600 focus:ring-teal-500"/>الخميس</label>
                                <label className="flex items-center"><input type="radio" name="day" value="الجمعة" checked={day === 'الجمعة'} onChange={(e) => setDay(e.target.value)} className="ml-2 text-teal-600 focus:ring-teal-500"/>الجمعة</label>
                            </div>
                        </div>
                    </div>
                    {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
                    <div className="mt-8 flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-3 sm:space-x-reverse">
                        <button type="button" onClick={onClose} className="mt-3 sm:mt-0 w-full sm:w-auto inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">إلغاء</button>
                        <button type="submit" className="w-full sm:w-auto inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-teal-600 text-base font-medium text-white hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500">تأكيد الحجز</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// --- مكون نافذة النجاح وميزات Gemini ---
const GeminiSuccessModal = ({ booking, onClose }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [resultText, setResultText] = useState('');
    const [error, setError] = useState('');
    const [copySuccess, setCopySuccess] = useState('');
    const resultRef = useRef(null);

    const callGeminiAPI = async (prompt) => {
        setIsLoading(true);
        setResultText('');
        setError('');
        const apiKey = "";
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;
        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
            });
            if (!response.ok) {
                throw new Error(`API Error: ${response.statusText}`);
            }
            const result = await response.json();
            const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
                setResultText(text);
            } else {
                throw new Error("لم يتم العثور على محتوى في استجابة Gemini.");
            }
        } catch (err) {
            console.error("Gemini API call failed:", err);
            setError("عذراً، حدث خطأ أثناء إنشاء المحتوى. الرجاء المحاولة مرة أخرى.");
        } finally {
            setIsLoading(false);
        }
    };

    const generateInvitation = () => {
        const prompt = `أنت شاعر ومبدع في كتابة الرسائل. اكتب رسالة دعوة قصيرة وودية للقاء الدورية الشهرية للأسرة. المضيف هو ${booking.host}، وسيكون اللقاء في ${booking.location} يوم ${booking.day} نهاية شهر ${booking.month} الهجري. اجعل الرسالة ترحيبية ودافئة، ومناسبة للنسخ والإرسال في الواتساب.`;
        callGeminiAPI(prompt);
    };

    const generateIdeas = () => {
        const prompt = `أنت مساعد لتنظيم اللقاءات العائلية. سيستضيف ${booking.host} الدورية الشهرية في شهر ${booking.month}. اقترح 3 أفكار إبداعية ومناسبة للعائلة السعودية للقاء، مع ذكر نشاط مقترح لكل فكرة. اجعل الاقتراحات قصيرة وفي نقاط واضحة.`;
        callGeminiAPI(prompt);
    };

    const handleCopy = () => {
        if (resultRef.current) {
            const range = document.createRange();
            range.selectNode(resultRef.current);
            window.getSelection().removeAllRanges();
            window.getSelection().addRange(range);
            try {
                document.execCommand('copy');
                setCopySuccess('تم النسخ!');
                setTimeout(() => setCopySuccess(''), 2000);
            } catch (err) {
                console.error('Failed to copy text: ', err);
            }
            window.getSelection().removeAllRanges();
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl p-6 sm:p-8 w-full max-w-lg" dir="rtl">
                <div className="text-center">
                    <h3 className="text-2xl font-bold text-teal-800">تم الحجز بنجاح!</h3>
                    <p className="text-gray-600 mt-2">دورية شهر <span className="font-semibold">{booking.month}</span> أصبحت باسم <span className="font-semibold">{booking.host}</span>.</p>
                </div>

                <div className="mt-6 text-center bg-teal-50 p-4 rounded-lg">
                    <p className="font-semibold text-teal-900">ماذا تريد أن تفعل الآن؟</p>
                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <button onClick={generateIdeas} disabled={isLoading} className="flex items-center justify-center w-full px-4 py-2 bg-white border border-teal-600 text-teal-700 rounded-lg hover:bg-teal-100 disabled:opacity-50 transition">
                             ✨ اقتراح أفكار للجمعة
                        </button>
                        <button onClick={generateInvitation} disabled={isLoading} className="flex items-center justify-center w-full px-4 py-2 bg-white border border-teal-600 text-teal-700 rounded-lg hover:bg-teal-100 disabled:opacity-50 transition">
                             ✨ إنشاء رسالة دعوة
                        </button>
                    </div>
                </div>

                {(isLoading || resultText || error) && (
                    <div className="mt-6">
                        {isLoading && <div className="text-center text-gray-500">جاري الإبداع...</div>}
                        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                        {resultText && (
                            <div className="bg-gray-100 rounded-lg p-4 relative">
                                <button onClick={handleCopy} className="absolute top-2 left-2 bg-gray-200 hover:bg-gray-300 text-gray-700 px-2 py-1 rounded-md text-xs flex items-center gap-1">
                                    {copySuccess ? copySuccess : <><ClipboardIcon /> نسخ</>}
                                </button>
                                <div ref={resultRef} className="whitespace-pre-wrap text-gray-800">{resultText}</div>
                            </div>
                        )}
                    </div>
                )}

                <div className="mt-8 text-center">
                    <button onClick={onClose} className="w-full sm:w-auto inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-6 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50">إغلاق</button>
                </div>
            </div>
        </div>
    );
};

// --- المكون الرئيسي للتطبيق (Main App Component) ---
export default function App() {
    const [db, setDb] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [bookings, setBookings] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [latestBooking, setLatestBooking] = useState(null);
    const [selectedMonth, setSelectedMonth] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    const hosts = useMemo(() => ['أبو سلطان','أبو عبدالله','أبو ثامر','العم عبد الرحمن','أبو فيصل','أبو عاصم','أبو أسامة','أبو فارس','أبو هشام','أبو محمد','أم نايف','أم عبدالله','أم سهيل','أم تركي','أم ريان','أم الوليد','أم فهد'], []);
    const locations = useMemo(() => ['مجالس أبوسلطان وأبوعبدالله', 'استراحة الملقا'], []);
    const hijriYear = '1447';
    const hijriMonths = useMemo(() => [{ name: 'ربيع الثاني', index: 4 },{ name: 'جمادى الأولى', index: 5 },{ name: 'جمادى الآخرة', index: 6 },{ name: 'رجب', index: 7 },{ name: 'شعبان', index: 8 },{ name: 'شوال', index: 10 },{ name: 'ذو القعدة', index: 11 },{ name: 'ذو الحجة', index: 12 },{ name: 'محرم', index: 1 },{ name: 'صفر', index: 2 },{ name: 'ربيع الأول', index: 3 },], []);

    useEffect(() => {
        try {
            const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : null;
            if (!firebaseConfig) { console.error("Firebase config not found."); setIsLoading(false); return; }
            const app = initializeApp(firebaseConfig);
            const firestoreDb = getFirestore(app);
            const firebaseAuth = getAuth(app);
            setDb(firestoreDb);
            onAuthStateChanged(firebaseAuth, async (user) => {
                if (!user) {
                    try {
                        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
                            await signInWithCustomToken(firebaseAuth, __initial_auth_token);
                        } else {
                            await signInAnonymously(firebaseAuth);
                        }
                    } catch (authError) { console.error("Authentication error:", authError); }
                }
                setIsAuthReady(true);
            });
        } catch (e) { console.error("Error initializing Firebase:", e); setIsLoading(false); }
    }, []);

    useEffect(() => {
        if (isAuthReady && db) {
            const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
            // Firestore collection paths should not begin with a leading slash
            // because Firestore treats the path as relative. A leading slash
            // results in an invalid reference and prevents bookings from being
            // retrieved.
            const bookingsCollectionPath = `artifacts/${appId}/public/data/bookings`;
            const q = query(collection(db, bookingsCollectionPath));
            const unsubscribe = onSnapshot(q, (querySnapshot) => {
                const bookingsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setBookings(bookingsData);
                setIsLoading(false);
            }, (err) => {
                console.error("Error fetching bookings:", err);
                setError('حدث خطأ في تحميل الحجوزات.');
                setIsLoading(false);
            });
            return () => unsubscribe();
        }
    }, [isAuthReady, db]);

    const getBookingForMonth = (monthName) => bookings.find(b => b.month === monthName && b.year === hijriYear);
    const handleOpenModal = (monthName) => { setSelectedMonth(monthName); setError(''); setShowModal(true); };
    const handleCloseModal = () => setShowModal(false);

    const handleConfirmBooking = async (bookingDetails) => {
        if (getBookingForMonth(bookingDetails.month)) { setError('هذا الشهر محجوز بالفعل.'); return; }
        try {
            const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
            // Use the same relative path when writing a new booking. Using a
            // leading slash here caused Firestore to reject the request,
            // preventing users from booking a date.
            const bookingsCollectionPath = `artifacts/${appId}/public/data/bookings`;
            const docId = `${hijriYear}_${bookingDetails.month}`;
            await setDoc(doc(db, bookingsCollectionPath, docId), { ...bookingDetails, year: hijriYear, createdAt: new Date() });
            setLatestBooking({ ...bookingDetails, year: hijriYear });
            handleCloseModal();
            setShowSuccessModal(true);
        } catch (err) {
            console.error("Error adding booking:", err);
            setError('حدث خطأ أثناء تأكيد الحجز.');
        }
    };

    if (isLoading) {
        return <div dir="rtl" className="flex items-center justify-center h-screen bg-gray-50 font-sans"><div className="text-xl text-gray-600">جاري تحميل جدول الدورية...</div></div>;
    }

    return (
        <div dir="rtl" className="bg-gray-50 min-h-screen font-sans text-gray-800 p-4 sm:p-6 lg:p-8">
            <div className="max-w-4xl mx-auto">
                <header className="text-center mb-8">
                    <h1 className="text-3xl sm:text-4xl font-bold text-teal-700">جدول الدورية الشهرية للأسرة</h1>
                    <p className="text-gray-500 mt-2">عام {hijriYear} هـ</p>
                    <p className="mt-4 text-sm max-w-2xl mx-auto text-gray-600">"مَنْ أَحَبَّ أَنْ يُبْسَطَ لَهُ فِي رِزْقِهِ، وَيُنْسَأَ لَهُ فِي أَثَرِهِ، فَلْيَصِلْ رَحِمَهُ"</p>
                </header>
                <main className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {hijriMonths.map((month) => (<MonthCard key={month.name} month={month} booking={getBookingForMonth(month.name)} onBook={handleOpenModal} />))}
                </main>
                <footer className="text-center mt-10 text-sm text-gray-400"><p>نسأل الله أن يديم علينا الوصل والمحبة.</p></footer>
            </div>
            {showModal && (<BookingModal month={selectedMonth} hosts={hosts} locations={locations} onConfirmBooking={handleConfirmBooking} onClose={handleCloseModal} initialError={error} />)}
            {showSuccessModal && latestBooking && (<GeminiSuccessModal booking={latestBooking} onClose={() => setShowSuccessModal(false)} />)}
        </div>
    );
}
