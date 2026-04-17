// DashboardAluno.tsx - Student Dashboard View
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { User, ClassSession, GroupEvent, MusicItem, HomeTraining, UniformOrder, UniformItem, SchoolReport, EventRegistration, PaymentRecord, StudentGrade } from '../types';
import { APPoints } from './APPoints';
import { useLanguage } from '../src/i18n/LanguageContext';
import { Calendar, Award, Music, Video, Instagram, MapPin, Copy, Check, Ticket, Wallet, Info, X, UploadCloud, Clock, AlertTriangle, ArrowLeft, AlertCircle, GraduationCap, FileText, Shirt, ShoppingBag, Camera, Eye, PlayCircle, DollarSign, FileUp, MessageCircle, PlusCircle, Activity, BookOpen, CheckCircle } from 'lucide-react';
import { Button } from '../components/Button';
import { supabase } from '../src/integrations/supabase/client';
import { Logo } from '../components/Logo';
import heic2any from 'heic2any';
import { QRCodeSVG } from 'qrcode.react';
import { generatePixPayload } from '../src/utils/pix';

const pixPayload = generatePixPayload('b6da3596-0aec-41ce-b118-47e4757a24d6', 'Andre Luis Guerreiro Nobrega', 'NOVA IGUACU');

interface Props {
  user: User;
  events: GroupEvent[];
  musicList: MusicItem[];
  uniformOrders: UniformOrder[];
  uniformItems?: UniformItem[];
  onAddOrder: (order: Omit<UniformOrder, 'id' | 'created_at'>) => void;
  onNotifyAdmin: (action: string, user: User) => void;
  onUpdateProfile: (data: Partial<User>) => void;
  homeTrainings: HomeTraining[];
  onAddHomeTraining: (training: Omit<HomeTraining, 'id' | 'created_at'>) => Promise<void>;
  schoolReports: SchoolReport[];
  onAddSchoolReport: (report: Omit<SchoolReport, 'id' | 'created_at'>) => Promise<void>;
  classSessions: ClassSession[];
  assignments: any[];
  onUpdateAssignment: (assignment: any) => Promise<void>;
  eventRegistrations: EventRegistration[];
  onAddEventRegistration: (newRegistration: Omit<EventRegistration, 'id' | 'registered_at'>) => Promise<void>;
  onUpdateEventRegistrationWithProof: (updatedRegistration: EventRegistration) => Promise<void>; // NEW PROP
  allUsersProfiles: User[];
  monthlyPayments?: PaymentRecord[];
  onUpdatePaymentRecord: (updatedPayment: PaymentRecord) => Promise<void>;
  studentGrades: StudentGrade[];
  onUpdateOrderWithProof: (orderId: string, proofUrl: string, proofName: string) => Promise<void>;
  uniformPrices?: Record<string, number>;
}

/**
 * Helper to convert HEIC/HEIF images (common on iPhones) to JPG
 * and ensure standard formats are handled correctly.
 */
const convertToStandardImage = async (file: File): Promise<File> => {
  const extension = file.name.split('.').pop()?.toLowerCase();
  let processingFile = file;

  // Skip non-image files (PDFs, etc.)
  if (!file.type.startsWith('image/')) {
    return file;
  }

  // 1. Convert HEIC/HEIF if necessary
  if (extension === 'heic' || extension === 'heif') {
    if (file.size > 20 * 1024 * 1024) throw alert("File too large / Arquivo muito grande");
    try {
      const blob = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.8 });
      const convertedBlob = Array.isArray(blob) ? blob[0] : blob;
      const newFileName = file.name.replace(/\.(heic|heif)$/i, '.jpg');
      processingFile = new File([convertedBlob], newFileName, { type: 'image/jpeg' });
    } catch (err) {
      console.error('HEIC conversion failed:', err);
      return file; // Return original if HEIC conversion fails
    }
  }

  // 2. Compress and resize all images (JPG, PNG, WEBP, and converted HEIC)
  const isImage = processingFile.type.startsWith('image/') && !processingFile.type.includes('gif');
  if (isImage) {
    try {
      return await new Promise((resolve, reject) => {
        // Timeout protection for Android PWA (15 seconds max)
        const timeout = setTimeout(() => {
          console.warn('Image processing timeout, using original file');
          resolve(processingFile);
        }, 15000);

        const reader = new FileReader();

        reader.onerror = () => {
          clearTimeout(timeout);
          console.error('FileReader error, using original file');
          resolve(processingFile);
        };

        reader.onload = (e) => {
          const img = new Image();

          img.onerror = () => {
            clearTimeout(timeout);
            console.error('Image load error, using original file');
            resolve(processingFile);
          };

          img.onload = () => {
            try {
              const canvas = document.createElement('canvas');
              let width = img.width;
              let height = img.height;
              const MAX_WIDTH = 1600;
              const MAX_HEIGHT = 1600;

              if (width > height) {
                if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
              } else {
                if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
              }

              canvas.width = width;
              canvas.height = height;
              const ctx = canvas.getContext('2d');
              ctx?.drawImage(img, 0, 0, width, height);

              canvas.toBlob((blob) => {
                clearTimeout(timeout);
                if (blob) {
                  const newName = processingFile.name.replace(/\.[^/.]+$/, "") + ".jpg";
                  resolve(new File([blob], newName, { type: 'image/jpeg', lastModified: Date.now() }));
                } else {
                  resolve(processingFile);
                }
              }, 'image/jpeg', 0.75);
            } catch (canvasError) {
              clearTimeout(timeout);
              console.error('Canvas error:', canvasError);
              resolve(processingFile);
            }
          };
          img.src = e.target?.result as string;
        };
        reader.readAsDataURL(processingFile);
      });
    } catch (err) {
      console.error('Compression failed:', err);
      return processingFile;
    }
  }

  return processingFile;
};


type MainTab = 'overview' | 'finance_resources' | 'grades' | 'assignments' | 'music' | 'home_training' | 'school_report' | 'uniform' | 'store' | 'appoints'; // Main tabs for student dashboard





export const DashboardAluno: React.FC<Props> = ({
  user,
  events,
  musicList,
  uniformOrders,
  uniformItems = [],
  onAddOrder,
  onNotifyAdmin,
  onUpdateProfile,
  homeTrainings,
  onAddHomeTraining,
  schoolReports,
  onAddSchoolReport,
  classSessions,
  assignments,
  onUpdateAssignment,
  eventRegistrations,
  onAddEventRegistration,
  onUpdateEventRegistrationWithProof, // NEW PROP
  allUsersProfiles,
  monthlyPayments = [],
  onUpdatePaymentRecord,
  studentGrades,
  onUpdateOrderWithProof,
  uniformPrices = { shirt: 0, pants_roda: 0, pants_train: 0, combo: 0 }
}) => {

  const { t } = useLanguage();
  const [activeMainTab, setActiveMainTab] = useState<MainTab>('overview'); // State for main tabs
  const [pixCopied, setPixCopied] = useState(false);
  const [costPixCopied, setCostPixCopied] = useState(false);

  // State for Video Pending Popup
  const [showPendingVideoPopup, setShowPendingVideoPopup] = useState(false);

  // Home Training State
  const [uploading, setUploading] = useState(false);

  // School Report State
  const [uploadingReport, setUploadingReport] = useState(false);

  // Uniform Order Form State
  const [orderForm, setOrderForm] = useState({
    item: 'combo',
    shirtSize: '',
    pantsSize: ''
  });

  // Event Registration State
  const [showEventRegisterModal, setShowEventRegisterModal] = useState(false);
  const [selectedEventToRegister, setSelectedEventToRegister] = useState<GroupEvent | null>(null);
  const [eventRegistrationAmount, setEventRegistrationAmount] = useState('');

  // Payment Proof Upload State
  const [uploadingPaymentProof, setUploadingPaymentProof] = useState(false);
  const [selectedPaymentToProof, setSelectedPaymentToProof] = useState<PaymentRecord | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null); // Ref for the hidden file input

  // Event Registration Proof Upload State
  const [uploadingEventProof, setUploadingEventProof] = useState(false);
  const [selectedEventRegToProof, setSelectedEventRegToProof] = useState<EventRegistration | null>(null);
  const eventFileInputRef = useRef<HTMLInputElement>(null); // Ref for the hidden file input for event proofs

  const uniformFileInputRef = useRef<HTMLInputElement>(null);

  // Uniform Order Proof Upload State
  const [uploadingUniformProof, setUploadingUniformProof] = useState(false);
  const [selectedOrderToProof, setSelectedOrderToProof] = useState<UniformOrder | null>(null);

  // Video/Link Training State
  const [trainingType, setTrainingType] = useState<'file' | 'link'>('link');
  const [videoLink, setVideoLink] = useState('');

  // Assignment Submission Upload State
  const [uploadingAssignment, setUploadingAssignment] = useState(false);
  const [selectedAssignmentToSubmit, setSelectedAssignmentToSubmit] = useState<any | null>(null);
  const assignmentFileInputRef = useRef<HTMLInputElement>(null);


  // Filter my orders from global state
  const myOrders = uniformOrders.filter(o => o.user_id === user.id);
  const myHomeTrainings = homeTrainings.filter(ht => ht.user_id === user.id);
  const mySchoolReports = schoolReports.filter(sr => sr.user_id === user.id);
  const myEventRegistrations = eventRegistrations.filter(reg => reg.user_id === user.id);
  const myRawPayments = monthlyPayments.filter(p => p.student_id === user?.id);
  const myMonthlyPayments = myRawPayments.filter(p => (!p.type || p.type === 'Mensalidade') && !p.month.toLowerCase().includes('avalia'));
  const myAssignments = assignments.filter(a => a.student_id === user.id);
  const myEvaluations = useMemo(() => myRawPayments.filter(p => (p.type === 'evaluation' || p.month.toLowerCase().includes('avalia'))), [myRawPayments]);
  const evalPayment = myEvaluations[0]; // for backward compatibility if needed elsewhere
  const beltColors = useMemo(() => {
    const b = (user.belt || 'Pagão').toLowerCase();
    const [mainPart, ...rest] = b.split('ponta');
    const pontaPart = rest.join('ponta');

    // Main colors
    const colorMap: Record<string, string> = {
      'verde': '#22c55e',
      'amarelo': '#FDD835',
      'azul': '#0033CC', // Azul Caneta (Darker Blue)
      'branco': '#ffffff',
      'cinza': '#9ca3af',
    };

    // Ponta colors - lighter/brighter shades for highlight effect
    const pontaColorMap: Record<string, string> = {
      'verde': '#4ade80',    // Lighter green
      'amarelo': '#FFEB3B',  // Brighter yellow
      'azul': '#1E90FF',     // Lighter blue (Dodger Blue)
      'branco': '#f0f0f0',   // Slightly off-white
    };

    // Calculate mainColor from belt name - don't use beltColor as initial value
    let mainColor = 'transparent';
    let pontaColor: string | null = null;

    // Smooth gradients - colors blend together
    if (mainPart.includes('pagão') || mainPart.trim() === '') {
      mainColor = 'transparent';
    } else if (mainPart.includes('verde, amarelo, azul e branco')) {
      mainColor = 'linear-gradient(to bottom, #22c55e, #FDD835, #0033CC, #ffffff)';
    } else if (mainPart.includes('amarelo e azul')) {
      mainColor = 'linear-gradient(to bottom, #FDD835, #0033CC)';
    } else if (mainPart.includes('verde e amarelo')) {
      mainColor = 'linear-gradient(to bottom, #22c55e, #FDD835)';
    } else if (mainPart.includes('verde e branco')) {
      mainColor = 'linear-gradient(to bottom, #22c55e, #ffffff)';
    } else if (mainPart.includes('amarelo e branco')) {
      mainColor = 'linear-gradient(to bottom, #FDD835, #ffffff)';
    } else if (mainPart.includes('azul e branco')) {
      mainColor = 'linear-gradient(to bottom, #0033CC, #ffffff)';
    } else if (mainPart.includes('cinza')) {
      mainColor = '#9ca3af';
    } else if (mainPart.includes('verde')) {
      mainColor = '#22c55e';
    } else if (mainPart.includes('amarelo')) {
      mainColor = '#FDD835';
    } else if (mainPart.includes('azul')) {
      mainColor = '#0033CC';
    } else if (mainPart.includes('branco')) {
      mainColor = '#ffffff';
    } else if (user.beltColor) {
      // Only use beltColor as fallback if no match found
      mainColor = user.beltColor;
    }

    // Ponta uses highlighted (lighter) colors for visual distinction
    if (pontaPart) {
      if (pontaPart.includes('verde') && pontaPart.includes('amarelo')) {
        pontaColor = 'linear-gradient(to bottom, #4ade80, #FFEB3B)';
      } else if (pontaPart.includes('verde')) pontaColor = pontaColorMap['verde'];
      else if (pontaPart.includes('amarelo')) pontaColor = pontaColorMap['amarelo'];
      else if (pontaPart.includes('azul')) pontaColor = pontaColorMap['azul'];
      else if (pontaPart.includes('branco')) pontaColor = pontaColorMap['branco'];
    }

    return { mainColor, pontaColor };
  }, [user.belt, user.beltColor]);

  // NEW: Determine the professor's ID based on the student's professorName
  const studentProfessor = useMemo(() => {
    return allUsersProfiles.find(
      (p) => (p.nickname === user.professorName || p.name === user.professorName) && (p.role === 'professor' || p.role === 'admin')
    );
  }, [allUsersProfiles, user.professorName, user.name]);

  const studentProfessorId = studentProfessor?.id;

  // NEW: Filter classes based on real data (Only Future/Today)
  const myClasses = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return classSessions.filter(
      (session) => {
        const sessionDate = new Date(session.date);
        // Adjust for timezone offset if necessary, but simple string comparison works for ISO YYYY-MM-DD if we are careful.
        // Better to use Date objects.
        // session.date is likely YYYY-MM-DD string.
        // Append T00:00:00 to ensure local time or UTC consistency if needed, 
        // but strictly: Create date from string + T12:00:00 to avoid timezone shift issues on pure dates.
        const sDate = new Date(session.date + 'T12:00:00');
        return studentProfessorId && session.professor_id === studentProfessorId && sDate >= today;
      }
    );
  }, [classSessions, studentProfessorId]);

  // Filter group classes: not by my professor, and not by an admin
  const groupClasses = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return classSessions.filter(
      (session) => {
        const sDate = new Date(session.date + 'T12:00:00');
        return session.professor_id !== studentProfessorId && sDate >= today;
      }
    );
  }, [classSessions, studentProfessorId]);

  // Check for pending video on mount
  useEffect(() => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 6 = Saturday

    // Don't show popup on weekends (Saturday = 6, Sunday = 0)
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    if (isWeekend) return;

    // Use local YYYY-MM-DD for comparison (safer than ISO)
    const todayStr = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');

    // Check if student has a class with their professor TODAY
    const hasClassToday = myClasses.some(session => session.date === todayStr);

    // If there's a class today, don't show popup (student will train in person)
    if (hasClassToday) return;

    // Check if student already sent a video/link TODAY
    const hasSentToday = myHomeTrainings.some(training => {
      // Use local date string comparison to match todayStr
      const trainingDate = new Date(training.date + 'T12:00:00');
      const tDateStr = trainingDate.getFullYear() + '-' + String(trainingDate.getMonth() + 1).padStart(2, '0') + '-' + String(trainingDate.getDate()).padStart(2, '0');
      return tDateStr === todayStr;
    });

    // Only show popup if: weekday + no class today + no video sent today
    if (!hasSentToday) {
      const timer = setTimeout(() => {
        setShowPendingVideoPopup(true);
      }, 300000); // 5 minutes delay (300,000ms) for better UX
      return () => clearTimeout(timer);
    } else {
      // Explicitly hide popup if video was already sent today
      setShowPendingVideoPopup(false);
    }
  }, [myClasses, myHomeTrainings]);

  const isOver18 = useMemo(() => {
    if (!user.birthDate) return false;
    const today = new Date();
    const birthDate = new Date(user.birthDate);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age >= 18;
  }, [user.birthDate]);

  const overdueStatus = useMemo(() => {
    const pending = myMonthlyPayments.filter(p => p.status === 'pending' || p.status === 'overdue');
    return {
      count: pending.length,
      isOverdue: pending.length >= 1,
      isCritical: pending.length >= 3,
      message: pending.length >= 3 ? t('aluno.finance.overdue_warning') : t('aluno.finance.overdue_msg'),
      color: pending.length >= 3 ? 'red' : pending.length === 2 ? 'orange' : 'yellow'
    };
  }, [myMonthlyPayments]);

  const handleCopyPix = () => {
    const pixKey = 'b6da3596-0aec-41ce-b118-47e4757a24d6';
    navigator.clipboard.writeText(pixKey);
    setPixCopied(true);
    onNotifyAdmin('Visualizou/Copiou PIX Mensalidade (Anjos da Paz)', user);
    setTimeout(() => setPixCopied(false), 2000);
  };

  const handleCopyCostPix = () => {
    const pixKey = 'b6da3596-0aec-41ce-b118-47e4757a24d6';
    navigator.clipboard.writeText(pixKey);
    setCostPixCopied(true);
    onNotifyAdmin('Visualizou/Copiou PIX de Custos/Eventos', user);
    setTimeout(() => setCostPixCopied(false), 2000);
  };

  // PROFILE PHOTO UPLOAD
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const handleProfilePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setUploadingPhoto(true);

    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/profile_${Date.now()}.${fileExt}`;

      // Upload to 'avatars' bucket (create if needed or use public)
      // Assuming 'avatars' bucket exists or similar public bucket.
      // Ideally should be a public bucket for ease of access
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (error) {
        // Fallback to 'school_reports_files' temporarily if avatars missing, 
        // but strictly avatars is better. Let's assume avatars exists from previous steps or create it.
        throw error;
      }

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);

      // Initialize updateData object
      const updateData: any = { photo_url: publicUrl };

      // Update auth metadata if possible (optional but good for consistency)
      await supabase.auth.updateUser({
        data: { avatar_url: publicUrl }
      });

      // Update profile in DB via onUpdateProfile (which handles the DB update usually)
      // But verify if onUpdateProfile does DB update or just local state.
      // Assuming onUpdateProfile triggers the DB update in App.tsx

      // Update profile table directly to be safe
      const { error: dbError } = await supabase
        .from('profiles')
        .update({ photo_url: publicUrl })
        .eq('id', user.id);

      if (dbError) throw dbError;

      onUpdateProfile({ photo_url: publicUrl }); // Update local state
      alert(t('aluno.profile.photo_updated'));

    } catch (error: any) {
      console.error('Error uploading profile photo:', error);
      alert(t('aluno.profile.photo_error') + error.message);
    } finally {
      setUploadingPhoto(false);
    }
  };



  const handleAddTrainingLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoLink) return;

    // Simple validation for Google Drive / Video links
    if (!videoLink.includes('drive.google.com') && !videoLink.includes('youtube.com') && !videoLink.includes('youtu.be') && !videoLink.includes('http')) {
      return alert(t('aluno.training.error_link'));
    }

    setUploading(true);
    try {
      const now = new Date();
      const expires = new Date(now.getTime() + (180 * 24 * 60 * 60 * 1000)); // Links last 6 months by default

      const newVideo: Omit<HomeTraining, 'id' | 'created_at'> = {
        user_id: user.id,
        date: now.toISOString().split('T')[0],
        video_name: `Link de Treino: ${now.toLocaleDateString()}`,
        video_url: videoLink,
        expires_at: expires.toISOString()
      };

      await onAddHomeTraining(newVideo);
      setUploading(false);
      setVideoLink('');
      setShowPendingVideoPopup(false);
      onNotifyAdmin('Enviou Link de Treino em Casa (Google Drive)', user);
      alert(t('aluno.training.success_link'));
    } catch (err: any) {
      console.error('Error adding video link:', err);
      alert(t('aluno.training.error_link') + ": " + err.message);
      setUploading(false);
    }
  };

  const handleUploadVideo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];
    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/home_trainings/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('home_training_videos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const now = new Date();
      const expires = new Date(now.getTime() + (72 * 60 * 60 * 1000)); // 72 hours from now

      const newVideo: Omit<HomeTraining, 'id' | 'created_at'> = {
        user_id: user.id,
        date: now.toISOString().split('T')[0],
        video_name: file.name,
        video_url: filePath, // Store the relative path instead of publicUrl for private buckets
        expires_at: expires.toISOString()
      };

      await onAddHomeTraining(newVideo);
      setUploading(false);
      setShowPendingVideoPopup(false);
      onNotifyAdmin('Enviou vídeo de Treino em Casa', user);
      alert(t('aluno.training.success_file'));
    } catch (error: any) {
      console.error('Error uploading video:', error);
      alert(t('common.error') + ": " + error.message);
      setUploading(false);
    }
  };

  const handleViewVideo = async (videoUrl: string, videoName: string) => {
    // If it's a external link (YouTube/Drive), open directly
    if (videoUrl.startsWith('http')) {
      window.open(videoUrl, '_blank');
      onNotifyAdmin(`Visualizou link de treino: ${videoName}`, user);
      return;
    }

    const newWindow = window.open('', '_blank');
    try {
      const { data, error } = await supabase.storage
        .from('home_training_videos')
        .createSignedUrl(videoUrl, 300); // 5 minutes

      if (error) throw error;
      if (newWindow) newWindow.location.href = data.signedUrl;
      onNotifyAdmin(`Visualizou vídeo de treino: ${videoName}`, user);
    } catch (error: any) {
      if (newWindow) newWindow.close();
      alert('Erro ao visualizar o vídeo: ' + error.message);
    }
  };

  const handleUploadReport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!e.target.files || e.target.files.length === 0) return;

    let file = e.target.files[0];
    setUploadingReport(true);

    try {
      // Support for iPhone HEIC
      file = await convertToStandardImage(file);

      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/school_reports/${Date.now()}.${fileExt}`; // Unique path per user

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('school_reports_files')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // For private buckets, we store the path and generate a signed URL when needed for viewing
      const fileUrl = uploadData.path;

      const now = new Date();

      const newReport: Omit<SchoolReport, 'id' | 'created_at'> = {
        user_id: user.id,
        date: now.toISOString().split('T')[0], // Use ISO format for DB
        file_name: file.name,
        file_url: fileUrl,
        period: t('aluno.report.period_current'), // Can be made dynamic if needed
        status: 'pending'
      };

      await onAddSchoolReport(newReport); // Call prop to add to Supabase
      setUploadingReport(false);
      onNotifyAdmin('Enviou Boletim Escolar', user); // Added notification
      alert(t('aluno.report.success'));
    } catch (error: any) {
      console.error('Error uploading report:', error);
      alert(t('common.error') + ": " + error.message);
      setUploadingReport(false);
    }
  };

  const handleViewReport = async (fileUrl: string, fileName: string) => {
    // Open window immediately to avoid pop-up blocking on mobile
    const newWindow = window.open('', '_blank');
    try {
      const { data, error } = await supabase.storage
        .from('school_reports_files')
        .createSignedUrl(fileUrl, 60); // URL valid for 60 seconds

      if (error) throw error;

      if (newWindow) {
        newWindow.location.href = data.signedUrl;
      }
      onNotifyAdmin(`Visualizou boletim: ${fileName}`, user); // Added notification
    } catch (error: any) {
      if (newWindow) newWindow.close();
      console.error('Error generating signed URL:', error);
      alert('Erro ao visualizar o arquivo: ' + error.message);
    }
  };

  const handleViewAssignment = async (fileUrl: string, fileName: string) => {
    const newWindow = window.open('', '_blank');
    try {
      const { data, error } = await supabase.storage
        .from('assignment_submissions')
        .createSignedUrl(fileUrl, 60);

      if (error) throw error;
      if (newWindow) newWindow.location.href = data.signedUrl;
      onNotifyAdmin(`Visualizou resposta de trabalho: ${fileName}`, user);
    } catch (error: any) {
      if (newWindow) newWindow.close();
      console.error('Error generating signed URL for assignment:', error);
      alert('Erro ao visualizar: ' + error.message);
    }
  };

  const handleGoToUpload = () => {
    setShowPendingVideoPopup(false);
    setActiveMainTab('home_training');
  };

  const handleOrderUniform = (e: React.FormEvent) => {
    e.preventDefault();

    let price = 0;
    let itemLabel = '';
    const customItem = uniformItems.find(item => item.id === orderForm.item);

    switch (orderForm.item) {
      case 'shirt': itemLabel = t('aluno.uniform.shirt_official'); price = uniformPrices.shirt; break;
      case 'pants_roda': itemLabel = t('aluno.uniform.pants_roda'); price = uniformPrices.pants_roda; break;
      case 'pants_train': itemLabel = t('aluno.uniform.pants_train'); price = uniformPrices.pants_train; break;
      case 'combo': itemLabel = t('aluno.uniform.combo'); price = uniformPrices.combo; break;
      default:
        if (customItem) {
          itemLabel = customItem.title;
          price = customItem.price ?? 0;
        }
        break;
    }

    if (orderForm.item === 'shirt' && !orderForm.shirtSize) { alert(t('aluno.uniform.error_size_shirt')); return; }
    if (orderForm.item.startsWith('pants') && !orderForm.pantsSize) { alert(t('aluno.uniform.error_size_pants')); return; }
    if (orderForm.item === 'combo' && (!orderForm.shirtSize || !orderForm.pantsSize)) { alert(t('aluno.uniform.error_sizes')); return; }

    const newOrder: Omit<UniformOrder, 'id' | 'created_at'> = {
      user_id: user.id,
      user_name: user.nickname || user.name,
      user_role: user.role,
      date: new Date().toLocaleDateString('pt-BR'),
      item: itemLabel,
      shirt_size: orderForm.item.includes('pants') ? undefined : orderForm.shirtSize,
      pants_size: orderForm.item === 'shirt' ? undefined : orderForm.pantsSize,
      total: price,
      status: 'pending'
    };

    onAddOrder(newOrder);

    alert(t('aluno.uniform.success', { price }));
    setOrderForm({ item: 'combo', shirtSize: '', pantsSize: '' });
  };

  const handleOrderStoreItem = (item: UniformItem) => {
    const newOrder: Omit<UniformOrder, 'id' | 'created_at'> = {
      user_id: user.id,
      user_name: user.nickname || user.name,
      user_role: user.role,
      date: new Date().toLocaleDateString('pt-BR'),
      item: item.title,
      total: item.price ?? 0,
      status: 'pending'
    };

    onAddOrder(newOrder);
    onNotifyAdmin(`Aluno ${user.nickname || user.name} solicitou item da loja virtual: ${item.title}`, user);
    alert(item.price == null ? 'Pedido enviado! Valor sob consulta.' : 'Pedido enviado!');
  };

  // Helper to get current price for display
  const getCurrentPrice = () => {
    const customItem = uniformItems.find(item => item.id === orderForm.item);
    if (customItem) return customItem.price ?? 0;
    switch (orderForm.item) {
      case 'shirt': return uniformPrices.shirt;
      case 'pants_roda': return uniformPrices.pants_roda;
      case 'pants_train': return uniformPrices.pants_train;
      case 'combo': return uniformPrices.combo;
      default: return 0;
    }
  };

  const selectedCustomUniformItem = uniformItems.find(item => item.id === orderForm.item);

  const handleOpenEventRegisterModal = (event: GroupEvent) => {
    setSelectedEventToRegister(event);
    setEventRegistrationAmount(event.price ? event.price.toString() : '0');
    setShowEventRegisterModal(true);
  };

  const handleRegisterForEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEventToRegister || !eventRegistrationAmount) return;

    const amount = parseFloat(eventRegistrationAmount);
    if (isNaN(amount) || amount < 0) {
      alert(t('error.invalid_amount'));
      return;
    }

    const newRegistration: Omit<EventRegistration, 'id' | 'registered_at'> = {
      event_id: selectedEventToRegister.id,
      user_id: user.id,
      user_name: user.nickname || user.name,
      event_title: selectedEventToRegister.title,
      amount_paid: amount,
      status: amount > 0 ? 'pending' : 'paid', // If price is 0, mark as paid directly
    };

    await onAddEventRegistration(newRegistration);
    onNotifyAdmin(`Registrou-se no evento: ${selectedEventToRegister.title}`, user);
    alert(t('aluno.event.success', { title: selectedEventToRegister.title }));
    setShowEventRegisterModal(false);
    setSelectedEventToRegister(null);
    setEventRegistrationAmount('');
  };

  const handleFileChangeForPaymentProof = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!e.target.files || e.target.files.length === 0 || !selectedPaymentToProof) {
      if (!selectedPaymentToProof && e.target.files && e.target.files.length > 0) {
        alert("Erro: Sessão de upload expirou. Por favor, clique novamente no botão 'Enviar Comprovante'.");
      }
      setUploadingPaymentProof(false);
      return;
    }

    let file = e.target.files[0];
    setUploadingPaymentProof(true);

    try {
      file = await convertToStandardImage(file);
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/payment_proofs/${selectedPaymentToProof.id}-${Date.now()}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('payment_proofs')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const updatedPayment: PaymentRecord = {
        ...selectedPaymentToProof,
        proof_url: uploadData.path,
        proof_name: file.name,
        status: 'pending',
      };

      await onUpdatePaymentRecord(updatedPayment);
      onNotifyAdmin(`Aluno ${user.nickname || user.name} enviou comprovante de pagamento para ${selectedPaymentToProof.month}`, user);

      alert("Comprovante enviado com sucesso! O Admin será notificado.");
      setSelectedPaymentToProof(null);
    } catch (error: any) {
      console.error('Error uploading payment proof:', error);
      alert("Erro ao enviar comprovante (" + (error.status || error.name) + "): " + error.message);
    } finally {
      setUploadingPaymentProof(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleFileChangeForEventProof = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!e.target.files || e.target.files.length === 0 || !selectedEventRegToProof) {
      if (!selectedEventRegToProof && e.target.files && e.target.files.length > 0) {
        alert("Erro: Sessão de upload expirou. Clique novamente em 'Pagar Agora'.");
      }
      setUploadingEventProof(false);
      return;
    }

    let file = e.target.files[0];
    setUploadingEventProof(true);

    try {
      file = await convertToStandardImage(file);
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/event_proofs/${selectedEventRegToProof.id}-${Date.now()}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('event_proofs') // Corrected to event_proofs bucket
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const updatedRegistration: EventRegistration = {
        ...selectedEventRegToProof,
        proof_url: uploadData.path,
        proof_name: file.name,
        status: 'pending',
      };

      await onUpdateEventRegistrationWithProof(updatedRegistration);
      onNotifyAdmin(`Aluno ${user.nickname || user.name} enviou comprovante de evento ${selectedEventRegToProof.event_title}`, user);

      alert("Comprovante de evento enviado com sucesso!");
      setSelectedEventRegToProof(null);
    } catch (error: any) {
      console.error('Error uploading event proof:', error);
      alert("Erro ao enviar comprovante de evento: " + error.message);
    } finally {
      setUploadingEventProof(false);
      if (eventFileInputRef.current) eventFileInputRef.current.value = '';
    }
  };



  const handleViewPaymentProof = async (filePath: string, proofName: string, bucket: string) => {
    // Open window immediately to avoid pop-up blocking on mobile
    const newWindow = window.open('', '_blank');
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(filePath, 60); // URL valid for 60 seconds

      if (error) {
        if (newWindow) newWindow.close();
        console.error('Error generating signed URL in DashboardAluno:', error);
        alert('Erro ao visualizar o comprovante: ' + error.message);
        return;
      }

      if (newWindow) {
        newWindow.location.href = data.signedUrl;
      }
      onNotifyAdmin(`Visualizou comprovante de pagamento: ${proofName}`, user);
    } catch (error: any) {
      if (newWindow) newWindow.close();
      console.error('Caught error in handleViewPaymentProof (DashboardAluno):', error);
      alert('Erro ao visualizar o comprovante: ' + error.message);
    }
  };

  const handleFileChangeForUniformProof = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!e.target.files || e.target.files.length === 0 || !selectedOrderToProof) {
      if (!selectedOrderToProof && e.target.files && e.target.files.length > 0) {
        alert("Erro: Sessão de upload expirou. Clique novamente no botão do uniforme.");
      }
      setUploadingUniformProof(false);
      return;
    }

    let file = e.target.files[0];
    setUploadingUniformProof(true);

    try {
      file = await convertToStandardImage(file);
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/uniform_proofs/${selectedOrderToProof.id}-${Date.now()}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('payment_proofs')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      await onUpdateOrderWithProof(selectedOrderToProof.id, uploadData.path, file.name);
      onNotifyAdmin(`Aluno ${user.nickname || user.name} enviou comprovante de uniforme: ${selectedOrderToProof.item}`, user);

      alert("Comprovante enviado com sucesso!");
      setSelectedOrderToProof(null);
    } catch (error: any) {
      console.error('Error uploading uniform proof:', error);
      alert("Erro ao enviar comprovante: " + error.message);
    } finally {
      setUploadingUniformProof(false);
      if (uniformFileInputRef.current) uniformFileInputRef.current.value = '';
    }
  };

  const handleAssignmentSubmission = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!e.target.files || e.target.files.length === 0 || !selectedAssignmentToSubmit) {
      setUploadingAssignment(false);
      return;
    }

    let file = e.target.files[0];
    setUploadingAssignment(true);

    try {
      // Support for iPhone HEIC/HEIF
      file = await convertToStandardImage(file);

      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/assignments/${selectedAssignmentToSubmit.id}-${Date.now()}.${fileExt}`;

      console.log('Finalizing upload to path:', filePath);

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('assignment_submissions')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        console.error('Supabase Storage Upload Error:', uploadError);
        throw uploadError;
      }

      // For private buckets, we store the path and generate a signed URL when needed for viewing
      const fileUrl = uploadData.path;

      const updatedAssignment = {
        id: selectedAssignmentToSubmit.id, // Only send identification
        status: 'completed' as const,     // and the fields to be updated
        submission_url: fileUrl,
        submission_name: file.name
      };

      console.log('Updating assignment via App.tsx handler...');
      await onUpdateAssignment(updatedAssignment);

      onNotifyAdmin(`Enviou resposta de trabalho: ${selectedAssignmentToSubmit.title}`, user);
      alert('Trabalho enviado com sucesso!');
      setSelectedAssignmentToSubmit(null);
    } catch (error: any) {
      console.error('Detailed error in handleAssignmentSubmission:', error);
      // More helpful error message for "failed to fetch"
      const msg = error.message === 'Failed to fetch'
        ? 'Erro de conexão: Não foi possível alcançar o servidor. Verifique sua internet ou se o arquivo é muito grande.'
        : error.message;
      alert('Erro ao enviar trabalho: ' + msg);
    } finally {
      setUploadingAssignment(false);
      if (assignmentFileInputRef.current) assignmentFileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in relative">

      {/* PENDING VIDEO POPUP */}
      {showPendingVideoPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-sky-100 rounded-2xl border-2 border-red-600 shadow-[0_0_30px_rgba(220,38,38,0.3)] max-w-md w-full p-6 relative">
            <div className="flex flex-col items-center text-center">
              <div className="bg-red-900/30 p-4 rounded-full mb-4 animate-pulse">
                <Video size={48} className="text-red-500" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">{t('aluno.training.popup_title')}</h3>
              <p className="text-gray-600 mb-6">
                {t('aluno.training.popup_msg')}
              </p>
              <div className="flex flex-col w-full gap-3">
                <Button fullWidth onClick={handleGoToUpload}>
                  {t('aluno.training.send_now')}
                </Button>
                <button
                  onClick={() => setShowPendingVideoPopup(false)}
                  className="text-gray-600 hover:text-gray-900 text-sm py-2 transition-colors"
                >
                  {t('aluno.training.later')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EVENT REGISTRATION MODAL (Mantido) */}
      {showEventRegisterModal && selectedEventToRegister && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-sky-100 rounded-2xl border border-sky-300 shadow-2xl max-w-md w-full p-6 relative">
            <button onClick={() => setShowEventRegisterModal(false)} className="absolute top-4 right-4 text-gray-600 hover:text-gray-900"><X size={20} /></button>
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Ticket className="text-purple-500" />
              {t('events.register')}
            </h3>
            <form onSubmit={handleRegisterForEvent} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">{t('events.field.title')}</label>
                <input
                  type="text"
                  value={selectedEventToRegister.title}
                  className="w-full bg-white border border-sky-300 rounded px-3 py-2 text-gray-900"
                  disabled
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">{t('common.date')}</label>
                <input
                  type="text"
                  value={selectedEventToRegister.date}
                  className="w-full bg-white border border-sky-300 rounded px-3 py-2 text-gray-900"
                  disabled
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">{t('common.value')}</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-gray-600">R$</span>
                  <input
                    type="number"
                    value={eventRegistrationAmount}
                    onChange={(e) => setEventRegistrationAmount(e.target.value)}
                    className="w-full bg-white border border-sky-300 rounded pl-10 pr-3 py-2 text-gray-900"
                    min="0"
                    step="0.01"
                    required
                    disabled={selectedEventToRegister.price === 0}
                  />
                </div>
                {selectedEventToRegister.price === 0 && (
                  <p className="text-xs text-gray-600 mt-1">{t('events.free_msg') || 'Este evento é gratuito.'}</p>
                )}
              </div>
              <div className="pt-4 flex justify-end gap-2 border-t border-sky-300 mt-4">
                <button type="button" onClick={() => setShowEventRegisterModal(false)} className="px-4 py-2 text-gray-600 hover:text-gray-900">{t('common.cancel')}</button>
                <Button type="submit">
                  <Ticket size={18} /> {t('common.confirm')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- DASHBOARD VIEW --- */}

      <div className="flex flex-col md:flex-row gap-6">

        {/* Profile Card */}
        <div className="w-full md:w-1/3 space-y-4">
          <div className="bg-sky-100 rounded-xl p-6 border border-sky-300 shadow-xl">
            <div className="flex flex-col items-center text-center">
              {/* Profile Image with Upload */}
              <div className="relative group cursor-pointer mb-4" onClick={() => !uploadingPhoto && photoInputRef.current?.click()} title="Clique para alterar a foto">
                <div className="w-24 h-24 rounded-full bg-sky-200 flex items-center justify-center border-4 border-white/40 overflow-hidden relative shadow-lg">
                  {user.photo_url ? (
                    <img src={user.photo_url} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <Logo className="w-full h-full object-cover" />
                  )}
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <Camera className="text-gray-900" size={24} />
                  </div>
                </div>
                {uploadingPhoto && <div className="absolute inset-0 flex items-center justify-center rounded-full"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>}
              </div>
              <input
                type="file"
                ref={photoInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleProfilePhotoUpload}
                disabled={uploadingPhoto}
              />

              <h2 className="text-2xl font-bold text-gray-900">{user.nickname || user.name}</h2>
              {user.nickname && <p className="text-gray-600 text-sm">{user.name}</p>}
              <p className="text-gray-600 text-xs mb-4">{user.email}</p>

              <div className="bg-sky-200 rounded-xl p-6 border border-sky-300 flex flex-col items-center justify-center space-y-4 mb-6">
                <div className="w-full max-w-sm bg-white rounded-lg p-6 overflow-hidden relative flex flex-col items-center text-center">
                  <div className="absolute left-0 top-0 bottom-0 w-2" style={{ background: beltColors.mainColor }}></div>
                  {beltColors.pontaColor && (
                    <div className="absolute left-0 bottom-0 w-2 h-1/3" style={{ background: beltColors.pontaColor }}></div>
                  )}
                  <p className="text-xs text-gray-600 uppercase tracking-wider mb-2">Graduação Atual</p>
                  <p className="text-2xl font-bold text-gray-900 flex items-center justify-center gap-2">
                    <Award className="text-orange-500" size={24} />
                    {user.belt || 'Pagão'}
                  </p>
                </div>

                <div className="w-full max-w-sm bg-green-900/20 rounded-lg p-6 border border-green-900/50 flex flex-col items-center text-center">
                  <p className="text-xs text-green-700 uppercase tracking-wider font-bold mb-2 flex items-center gap-1">
                    <GraduationCap size={16} /> Próxima Avaliação
                  </p>
                  <div className="flex flex-col items-center gap-2">
                    {(() => {
                      const userInstallments = monthlyPayments.filter(p =>
                        p.student_id === user.id &&
                        p.month?.includes('Parcela')
                      );
                      const paidInstallments = userInstallments.filter(p => p.status === 'paid');
                      const pendingInstallments = userInstallments.filter(p => p.status !== 'paid');
                      const remainingValue = pendingInstallments.reduce((sum, p) => sum + (p.amount || 0), 0);
                      const totalPaid = paidInstallments.reduce((sum, p) => sum + (p.amount || 0), 0);

                      return (
                        <>
                          {remainingValue > 0 ? (
                            <>
                              <p className="text-sm text-gray-600">Valor Restante Parcelas:</p>
                              <p className="text-2xl font-bold text-gray-900">R$ {remainingValue.toFixed(2).replace('.', ',')}</p>
                              <div className="flex gap-2 text-xs">
                                <span className="text-green-700">{paidInstallments.length} pagas</span>
                                <span className="text-gray-600">|</span>
                                <span className="text-orange-600">{pendingInstallments.length} pendentes</span>
                              </div>
                              <div className="w-full bg-sky-200 rounded-full h-2 mt-2">
                                <div
                                  className="bg-green-500 h-2 rounded-full transition-all"
                                  style={{ width: `${userInstallments.length > 0 ? (paidInstallments.length / userInstallments.length) * 100 : 0}%` }}
                                />
                              </div>
                            </>
                          ) : (
                            <>
                              <p className="text-2xl font-bold text-gray-900">R$ {Number(user.graduationCost || 0).toFixed(2).replace('.', ',')}</p>
                              {totalPaid > 0 && (
                                <span className="text-xs text-green-700">✓ Parcelas quitadas</span>
                              )}
                            </>
                          )}
                        </>
                      );
                    })()}

                    {user.nextEvaluationDate && (
                      <span className="text-sm text-gray-600 bg-sky-50/50 px-3 py-1 rounded-full mt-2">
                        Data: <span className="text-green-700">{user.nextEvaluationDate.split('-').reverse().join('/')}</span>
                      </span>
                    )}
                    {(user.graduationCost ?? 0) === 0 ? (
                      <p className="text-[10px] text-gray-600 mt-1">Custo definido pela coordenação (Gratuito)</p>
                    ) : (
                      <p className="text-[10px] text-gray-600 mt-1">Valor definido pela coordenação</p>
                    )}
                  </div>
                </div>
              </div>


              {user.professorName && (
                <div className="mb-4">
                  <p className="text-xs text-gray-600 uppercase tracking-wider">Professor</p>
                  <p className="text-gray-900 font-semibold">{user.professorName}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 w-full">
                <div className="bg-white p-3 rounded-lg">
                  <p className="text-2xl font-bold text-gray-900">{myClasses.length}</p> {/* Updated to myClasses.length */}
                  <p className="text-xs text-gray-600">Aulas no Mês</p>
                </div>
                <div className="bg-white p-3 rounded-lg">
                  <p className="2xl font-bold text-gray-900">{events.length}</p>
                  <p className="text-xs text-gray-600">Eventos</p>
                </div>
              </div>
            </div>
          </div>

          <a
            href="https://www.instagram.com/filhosdofogo2005"
            target="_blank"
            rel="noopener noreferrer"
            className="block"
          >
            <Button fullWidth className="bg-gradient-to-r from-pink-600 via-purple-600 to-orange-500 border-none mb-4">
              <Instagram size={20} />
              Siga @filhosdofogo2005
            </Button>
          </a>


        </div>

        {/* Schedule & Content */}
        <div className="w-full md:w-2/3 space-y-6">
          {/* Tabs Navigation */}
          <div className="tabs-scroll border-b border-sky-300 pb-1">
            <button
              onClick={() => setActiveMainTab('overview')}
              className={`px-3 py-2 rounded-t-lg font-medium transition-colors text-sm whitespace-nowrap ${activeMainTab === 'overview' ? 'bg-sky-100 text-orange-500 border-t-2 border-orange-500' : 'text-gray-600 hover:text-gray-900 hover:bg-sky-100'}`}
            >
              {t('aluno.tab.overview')}
            </button>
            <button
              onClick={() => setActiveMainTab('finance_resources')}
              className={`px-3 py-2 rounded-t-lg font-medium transition-colors text-sm whitespace-nowrap ${activeMainTab === 'finance_resources' ? 'bg-sky-100 text-green-500 border-t-2 border-green-500' : 'text-gray-600 hover:text-gray-900 hover:bg-sky-100'}`}
            >
              {t('aluno.tab.finance')}
            </button>
            <button
              onClick={() => setActiveMainTab('assignments')}
              className={`px-3 py-2 rounded-t-lg font-medium transition-colors text-sm whitespace-nowrap ${activeMainTab === 'assignments' ? 'bg-sky-100 text-cyan-500 border-t-2 border-cyan-500' : 'text-gray-600 hover:text-gray-900 hover:bg-sky-100'}`}
            >
              {t('aluno.tab.assignments')}
            </button>
            <button
              onClick={() => setActiveMainTab('music')}
              className={`px-3 py-2 rounded-t-lg font-medium transition-colors text-sm whitespace-nowrap ${activeMainTab === 'music' ? 'bg-sky-100 text-yellow-500 border-t-2 border-yellow-500' : 'text-gray-600 hover:text-gray-900 hover:bg-sky-100'}`}
            >
              {t('aluno.tab.music')}
            </button>
            <button
              onClick={() => setActiveMainTab('home_training')}
              className={`px-3 py-2 rounded-t-lg font-medium transition-colors text-sm whitespace-nowrap ${activeMainTab === 'home_training' ? 'bg-sky-100 text-purple-500 border-t-2 border-purple-500' : 'text-gray-600 hover:text-gray-900 hover:bg-sky-100'}`}
            >
              {t('aluno.tab.training')}
            </button>
            <button
              onClick={() => setActiveMainTab('school_report')}
              className={`px-3 py-2 rounded-t-lg font-medium transition-colors text-sm whitespace-nowrap ${activeMainTab === 'school_report' ? 'bg-sky-100 text-indigo-500 border-t-2 border-indigo-500' : 'text-gray-600 hover:text-gray-900 hover:bg-sky-100'}`}
            >
              {t('aluno.tab.report')}
            </button>
            <button
              onClick={() => setActiveMainTab('uniform')}
              className={`px-3 py-2 rounded-t-lg font-medium transition-colors text-sm whitespace-nowrap ${activeMainTab === 'uniform' ? 'bg-sky-100 text-emerald-500 border-t-2 border-emerald-500' : 'text-gray-600 hover:text-gray-900 hover:bg-sky-100'}`}
            >
              {t('aluno.tab.uniform')}
            </button>
            <button
              onClick={() => setActiveMainTab('grades')}
              className={`px-3 py-2 rounded-t-lg font-medium transition-colors text-sm whitespace-nowrap ${activeMainTab === 'grades' ? 'bg-sky-100 text-blue-500 border-t-2 border-blue-500' : 'text-gray-600 hover:text-gray-900 hover:bg-sky-100'}`}
            >
              {t('aluno.tab.grades')}
            </button>
            <button
              onClick={() => setActiveMainTab('appoints')}
              className={`px-3 py-2 rounded-t-lg font-medium transition-colors text-sm whitespace-nowrap flex items-center gap-1 ${activeMainTab === 'appoints' ? 'bg-sky-100 text-blue-500 border-t-2 border-blue-500' : 'text-gray-600 hover:text-gray-900 hover:bg-sky-100'}`}
            >
              {t('aluno.tab.ffpoints')}
            </button>
          </div>

          {/* OVERDUE ALERT FOR ADULT STUDENTS */}
          {isOver18 && overdueStatus.isOverdue && (
            <div className={`p-4 rounded-xl border mb-6 flex items-center gap-4 animate-pulse-subtle shadow-lg ${overdueStatus.color === 'red' ? 'bg-red-900/30 border-red-500 text-red-500 shadow-red-900/20' :
              overdueStatus.color === 'orange' ? 'bg-orange-900/30 border-orange-500 text-orange-600 shadow-orange-900/20' :
                'bg-yellow-900/30 border-yellow-500 text-yellow-700 shadow-yellow-900/20'
              }`}>
              <div className={`p-2 rounded-lg ${overdueStatus.color === 'red' ? 'bg-red-500/20' : overdueStatus.color === 'orange' ? 'bg-orange-500/20' : 'bg-yellow-500/20'}`}>
                <AlertTriangle size={24} />
              </div>
              <div>
                <h4 className="font-black text-sm uppercase tracking-tighter">
                  {overdueStatus.count === 1 ? 'Uma mensalidade pendente' : `${overdueStatus.count} mensalidades pendentes`}
                </h4>
                <p className="text-xs font-medium leading-tight mt-0.5">{overdueStatus.message}</p>
              </div>
            </div>
          )}

          {/* --- TAB: OVERVIEW --- */}
          {activeMainTab === 'overview' && (
            <div className="space-y-6 animate-fade-in">
              {/* Resumo de Atividades (Summary) */}
              <div className="bg-sky-100 rounded-xl p-6 border border-sky-300 shadow-xl">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Activity className="text-cyan-500" />
                  {t('aluno.overview.title')}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Pending Assignments */}
                  <div
                    onClick={() => setActiveMainTab('assignments')}
                    className="bg-sky-50/50 p-4 rounded-xl border border-sky-300 hover:border-cyan-500/50 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-cyan-500/10 rounded-lg text-cyan-500">
                        <BookOpen size={20} />
                      </div>
                      <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">{t('assignments.title')}</span>
                    </div>
                    <p className="text-2xl font-black text-gray-900">
                      {myAssignments.filter(a => a.status === 'pending').length}
                    </p>
                    <p className="text-[10px] text-gray-600 mt-1">{t('aluno.overview.assignments_pending')}</p>
                  </div>

                  {/* Home Training Status */}
                  <div
                    onClick={() => setActiveMainTab('home_training')}
                    className="bg-sky-50/50 p-4 rounded-xl border border-sky-300 hover:border-purple-500/50 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-purple-500/10 rounded-lg text-purple-500">
                        <Video size={20} />
                      </div>
                      <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">{t('training.title')}</span>
                    </div>
                    <p className="text-sm font-bold text-gray-900">
                      {myHomeTrainings.length > 0 ? (
                        <span className="text-green-700 flex items-center gap-1"><Check size={14} /> {t('status.ready')}</span>
                      ) : (
                        <span className="text-yellow-700 flex items-center gap-1"><AlertCircle size={14} /> {t('status.pending')}</span>
                      )}
                    </p>
                    <p className="text-[10px] text-gray-600 mt-1">{t('aluno.overview.training_today')}</p>
                  </div>

                  {/* Next Evaluate status */}
                  <div
                    onClick={() => setActiveMainTab('grades')}
                    className="bg-sky-50/50 p-4 rounded-xl border border-sky-300 hover:border-orange-500/50 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-orange-500/10 rounded-lg text-orange-500">
                        <Award size={20} />
                      </div>
                      <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">{t('grades.evaluate')}</span>
                    </div>
                    <p className="text-sm font-bold text-gray-900">
                      {user.nextEvaluationDate ? new Date(user.nextEvaluationDate).toLocaleDateString('pt-BR') : t('aluno.overview.to_be_defined')}
                    </p>
                    <p className="text-[10px] text-gray-600 mt-1">{t('aluno.overview.eval_date')}</p>
                  </div>

                  <div
                    onClick={() => setActiveMainTab('store')}
                    className="bg-sky-50/50 p-4 rounded-xl border border-sky-300 hover:border-amber-500/50 transition-all cursor-pointer group sm:col-span-3"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-amber-500/10 rounded-lg text-amber-600">
                        <ShoppingBag size={20} />
                      </div>
                      <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">Nossa Loja Virtual</span>
                    </div>
                    <p className="text-sm font-bold text-gray-900">Veja os itens personalizados cadastrados para o grupo.</p>
                    <p className="text-[10px] text-gray-600 mt-1">{uniformItems.length} itens disponíveis</p>
                  </div>
                </div>
              </div>


              {/* Suas Próximas Aulas (Specific Professor) */}
              <div className="bg-sky-100 rounded-xl p-6 border-2 border-orange-600/50 shadow-[0_0_15px_rgba(234,88,12,0.1)]">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Calendar className="text-orange-500" />
                  {t('aluno.overview.classes')}
                </h3>
                <div className="space-y-3">
                  {myClasses.length > 0 ? (
                    myClasses.map((session) => (
                      <div key={session.id} className="flex flex-col sm:flex-row sm:items-center justify-between bg-sky-50/50 p-4 rounded-lg border-l-4 border-orange-500 relative overflow-hidden">
                        <div>
                          {session.title && <p className="text-gray-900 font-bold text-base mb-0.5">{session.title}</p>}
                          <p className="text-orange-600 font-bold text-lg">{session.date} • {session.time}</p>
                          {session.category && (
                            <span className="inline-block text-[10px] font-black uppercase tracking-widest bg-orange-900/30 text-orange-600 border border-orange-900/50 px-2 py-0.5 rounded-full mr-2 mb-1">
                              {session.category}
                            </span>
                          )}
                          <p className="text-sm text-gray-600">{session.location} - {session.instructor}</p>
                        </div>
                        <div className="mt-3 sm:mt-0">
                          <span className="bg-red-900/40 text-red-600 border border-red-900/50 px-3 py-1 rounded text-xs font-bold flex items-center gap-1">
                            <AlertCircle size={12} /> {t('common.required')}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-600 italic">{t('aluno.overview.classes_empty')}</p>
                  )}
                </div>
              </div>

              {/* Próximas Aulas do Grupo (Other Professors) */}
              <div className="bg-sky-100 rounded-xl p-6 border border-sky-300">
                <h3 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <Calendar className="text-gray-600" />
                  {t('aluno.overview.classes_group')}
                </h3>
                <p className="text-xs text-gray-600 mb-4 bg-sky-50/50 p-2 rounded border border-sky-300 inline-block">
                  {t('aluno.overview.classes_group_desc')}
                </p>
                <div className="space-y-3">
                  {groupClasses.length > 0 ? (
                    groupClasses.map((session) => {
                      // Find the professor's profile to get their nickname/name
                      const sessionProfessor = allUsersProfiles.find(p => p.id === session.professor_id);
                      const professorDisplayName = sessionProfessor?.nickname || sessionProfessor?.name || session.instructor;

                      return (
                        <div key={session.id} className="flex flex-col sm:flex-row sm:items-center justify-between bg-white/30 p-4 rounded-lg border-l-2 border-sky-300 opacity-80 hover:opacity-100 transition-opacity">
                          <div>
                            {session.title && <p className="text-gray-700 font-bold text-base mb-0.5">{session.title}</p>}
                            <p className="text-gray-600 font-semibold">{session.date} • {session.time}</p>
                            {session.category && (
                              <span className="inline-block text-[10px] font-black uppercase tracking-widest bg-sky-100 text-gray-600 border border-sky-300 px-2 py-0.5 rounded-full mr-2 mb-1">
                                {session.category}
                              </span>
                            )}
                            <p className="text-xs text-gray-600">{session.location} - {professorDisplayName}</p>
                          </div>
                          <div className="mt-2 sm:mt-0">
                            <span className="text-gray-600 text-xs font-bold border border-sky-300 px-2 py-1 rounded">
                              {t('common.optional')}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-gray-600 italic">Nenhuma outra aula do grupo agendada.</p>
                  )}
                </div>
              </div>

              {/* Mural de Eventos */}
              <div className="bg-sky-100 rounded-xl p-6 border border-sky-300">
                <h3 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <MapPin className="text-orange-500" />
                  Mural de Eventos
                </h3>
                <p className="text-xs text-red-600 mb-4 bg-red-900/20 p-2 rounded border border-red-900/50 inline-flex items-center gap-1">
                  <AlertCircle size={12} /> Todos os eventos são de participação obrigatória.
                </p>
                <div className="space-y-3">
                  {events.filter(e => !e.status || e.status === 'active').length > 0 ? (
                    events.filter(e => !e.status || e.status === 'active').map((event) => {
                      const timeMatch = (event.description || '').match(/^\[Horário:\s*(.*?)\]\n?/);
                      const displayTime = event.event_time || (timeMatch ? timeMatch[1] : null);
                      const displayDesc = timeMatch ? event.description.replace(/^\[Horário:\s*(.*?)\]\n?/, '') : event.description;

                      return (
                        <div key={event.id} className="flex flex-col p-4 bg-sky-50/50 rounded-lg border-l-4 border-red-500">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="text-gray-900 font-bold text-lg">{event.title}</h4>
                              <p className="text-gray-600 text-sm mt-1">{displayDesc}</p>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <span className="bg-sky-100 text-orange-600 px-2 py-1 rounded text-xs font-bold whitespace-nowrap">
                                {event.date.split('-').reverse().join('/')} {displayTime && <span className="text-gray-600 ml-1">às {displayTime}</span>}
                              </span>
                              {event.price && event.price > 0 && (
                                <span className="flex items-center gap-1 text-green-700 bg-green-900/20 px-2 py-1 rounded text-xs font-bold border border-green-900/50">
                                  <DollarSign size={12} /> R$ {event.price.toFixed(2).replace('.', ',')}
                                </span>
                              )}
                              <span className="bg-red-900/40 text-red-600 border border-red-900/50 px-2 py-1 rounded text-xs font-bold flex items-center gap-1">
                                <AlertCircle size={12} /> Obrigatório
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-gray-600 italic">Nenhum evento programado.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* --- TAB: FINANCEIRO --- */}
          {activeMainTab === 'finance_resources' && (
            <div className="space-y-6 animate-fade-in">
              <Button variant="ghost" className="mb-2 text-gray-600 p-0 hover:text-gray-900" onClick={() => setActiveMainTab('overview')}>
                <ArrowLeft size={16} className="mr-2" />
                Voltar ao Painel
              </Button>

              <div className="grid lg:grid-cols-2 gap-8">
                {/* Mensalidades Card */}
                <div className="space-y-6">
                  <div className="bg-sky-50/50 p-6 rounded-2xl border border-sky-300 shadow-xl">
                    <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                      <Wallet className="text-orange-500" />
                      {t('aluno.finance.title')}
                    </h3>

                    <div className="mb-6 space-y-3 flex flex-col items-center">
                      <div className="p-4 bg-white rounded-xl shadow-sm border border-gray-100 flex items-center justify-center">
                        <QRCodeSVG value={pixPayload} size={160} />
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCopyPix}
                        className={`text-[10px] transition-all h-8 ${pixCopied ? "text-green-600 bg-green-500/10" : "text-gray-500 hover:text-orange-600 hover:bg-orange-500/10"}`}
                      >
                        {pixCopied ? <Check size={14} className="mr-1" /> : <Copy size={14} className="mr-1" />}
                        {pixCopied ? t('aluno.finance.pix_copied') : 'Copiar Código PIX'}
                      </Button>
                      <p className="text-[10px] text-gray-400 text-center font-bold tracking-widest uppercase">{t('aluno.finance.key')}</p>
                    </div>

                    <div className="space-y-3">
                      {myMonthlyPayments.length > 0 ? (
                        myMonthlyPayments.map(payment => (
                          <div key={payment.id} className={`bg-white p-4 rounded-xl border-l-4 ${payment.status === 'paid' ? 'border-green-500' : 'border-yellow-500'} flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shadow-md`}>
                            <div>
                              <p className="font-bold text-gray-900 text-sm uppercase tracking-tight">{payment.month}</p>
                              <p className="text-gray-600 text-xs font-mono">R$ {payment.amount?.toFixed(2).replace('.', ',')} • {t('aluno.finance.due_date')} {payment.due_date?.split('-').reverse().join('/')}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              {payment.status === 'paid' ? (
                                <span className="bg-green-500/10 text-green-700 text-[10px] font-black px-2 py-1 rounded border border-green-500/20 uppercase">{t('aluno.finance.paid')}</span>
                              ) : (
                                <>
                                  <Button
                                    variant="secondary"
                                    className="text-[10px] h-auto px-2 py-1 bg-sky-100 border-sky-300"
                                    onClick={() => {
                                      setSelectedPaymentToProof(payment);
                                      // Small delay to ensure state is set before click (fixes mobile PWA issue)
                                      setTimeout(() => fileInputRef.current?.click(), 100);
                                    }}
                                    disabled={uploadingPaymentProof}
                                  >
                                    {uploadingPaymentProof && selectedPaymentToProof?.id === payment.id ? t('aluno.finance.sending') : <><FileUp size={12} className="mr-1" /> {t('aluno.finance.send_proof')}</>}
                                  </Button>
                                  <input
                                    type="file"
                                    accept="image/*, application/pdf, .heic, .heif"
                                    className="hidden"
                                    ref={fileInputRef}
                                    onChange={handleFileChangeForPaymentProof}
                                    onClick={(e) => e.stopPropagation()}
                                    disabled={uploadingPaymentProof}
                                  />
                                </>
                              )}
                              {payment.proof_url && (
                                <button
                                  onClick={() => handleViewPaymentProof(payment.proof_url!, payment.proof_name || t('aluno.finance.view_proof'), 'payment_proofs')}
                                  className="text-blue-700 hover:text-blue-600 text-xs p-1 rounded hover:bg-blue-400/5 transition-all"
                                  title={t('aluno.finance.view_proof')}
                                >
                                  <Eye size={18} />
                                </button>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-600 text-sm italic text-center py-6 bg-sky-100/50 rounded-xl border border-dashed border-sky-300">{t('aluno.finance.empty')}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Eventos e Avaliações Card */}
                <div className="space-y-6">
                  <div className="bg-sky-50/50 p-6 rounded-2xl border border-sky-300 shadow-xl">
                    <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                      <DollarSign className="text-yellow-500" />
                      {t('aluno.finance.other_payments')}
                    </h3>

                    <div className="mb-6 flex flex-col items-center space-y-3">
                      <div className="p-4 bg-white rounded-xl shadow-sm border border-gray-100 flex items-center justify-center">
                        <QRCodeSVG value={pixPayload} size={160} />
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCopyCostPix}
                        className={`text-[10px] transition-all h-8 ${costPixCopied ? "text-green-600 bg-green-500/10" : "text-gray-500 hover:text-yellow-600 hover:bg-yellow-500/10"}`}
                      >
                        {costPixCopied ? <Check size={14} className="mr-1" /> : <Copy size={14} className="mr-1" />}
                        {costPixCopied ? t('aluno.finance.pix_copied') : 'Copiar Código PIX'}
                      </Button>
                    </div>

                    <div className="space-y-6">
                      {/* Avaliações Section */}
                      <div>
                        <h4 className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-3 ml-1">{t('aluno.finance.evaluations')}</h4>
                        <div className="space-y-3">
                          {myEvaluations.length > 0 ? (
                            myEvaluations.map(payment => (
                              <div key={payment.id} className="bg-white/80 p-4 rounded-xl border border-sky-200 flex justify-between items-center shadow-sm">
                                <div>
                                  <p className="text-sm font-bold text-gray-900">{payment.month}</p>
                                  <p className="text-[10px] text-gray-600 font-mono">{t('aluno.finance.value')} R$ {payment.amount?.toFixed(2).replace('.', ',')}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                  {payment.status === 'paid' ? (
                                    <CheckCircle className="text-green-500" size={20} />
                                  ) : (
                                    <button
                                      onClick={() => { setSelectedPaymentToProof(payment); fileInputRef.current?.click(); }}
                                      className="text-[10px] font-black uppercase text-yellow-500 hover:text-yellow-700 bg-yellow-500/5 px-2 py-1 rounded border border-yellow-500/20"
                                    >
                                      {payment.proof_url ? t('aluno.finance.change_proof') : t('aluno.finance.pay_now')}
                                    </button>
                                  )}
                                  {payment.proof_url && (
                                    <button
                                      onClick={() => handleViewPaymentProof(payment.proof_url!, payment.month || t('aluno.finance.view_proof'), 'payment_proofs')}
                                      className="text-blue-700 hover:text-blue-600 transition-all"
                                      title={t('aluno.finance.view_proof')}
                                    >
                                      <Eye size={18} />
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))
                          ) : (
                            <p className="text-gray-600 text-[10px] italic ml-1">{t('aluno.finance.evaluations_empty')}</p>
                          )}
                        </div>
                      </div>

                      {/* EventRegistrations Section */}
                      <div>
                        <h4 className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-3 ml-1">{t('aluno.finance.events')}</h4>
                        <div className="space-y-3">
                          {myEventRegistrations.length > 0 ? (
                            myEventRegistrations.map(reg => (
                              <div key={reg.id} className="bg-white/80 p-4 rounded-xl border border-sky-200 flex justify-between items-center shadow-sm">
                                <div>
                                  <p className="text-sm font-bold text-gray-900 truncate max-w-[150px]">{reg.event_title}</p>
                                  <p className="text-[10px] text-gray-600 font-mono uppercase">{reg.status === 'paid' ? t('aluno.finance.paid') : t('aluno.finance.pending')}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                  {reg.status === 'paid' ? (
                                    <div className="bg-green-500/20 p-1 rounded-full"><Check className="text-green-500" size={14} /></div>
                                  ) : (
                                    <button
                                      onClick={() => {
                                        setSelectedEventRegToProof(reg);
                                        // Small delay for mobile PWA
                                        setTimeout(() => eventFileInputRef.current?.click(), 100);
                                      }}
                                      className="text-[10px] font-black uppercase text-orange-500 hover:text-orange-600 bg-orange-500/5 px-2 py-1 rounded border border-orange-500/20"
                                    >
                                      {reg.proof_url ? 'Alterar Comprovante' : 'Pagar Agora'}
                                    </button>
                                  )}
                                  {reg.proof_url && (
                                    <button
                                      onClick={() => handleViewPaymentProof(reg.proof_url!, reg.event_title + ' Comprovante', 'payment_proofs')}
                                      className="text-blue-700 hover:text-blue-600 transition-all"
                                      title="Ver Comprovante"
                                    >
                                      <Eye size={18} />
                                    </button>
                                  )}
                                  <input type="file" ref={eventFileInputRef} accept="image/*, application/pdf, .heic, .heif" className="hidden" onChange={handleFileChangeForEventProof} />
                                </div>
                              </div>
                            ))
                          ) : (
                            <p className="text-gray-600 text-[10px] italic ml-1">Nenhuma inscrição.</p>
                          )}
                        </div>
                      </div>

                      {/* Uniform Orders Selection */}
                      <div>
                        <h4 className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-3 ml-1">{t('aluno.uniform.title')}</h4>
                        <div className="space-y-3">
                          <Button
                            fullWidth
                            variant="outline"
                            size="sm"
                            onClick={() => setActiveMainTab('uniform')}
                            className="mb-2 border-dashed border-sky-300 text-gray-600 hover:text-gray-900 hover:border-stone-500 transition-all text-[10px] h-8"
                          >
                            <PlusCircle size={14} className="mr-1" /> {t('aluno.uniform.new_order')}
                          </Button>
                          {uniformOrders.filter(o => o.user_id === user.id).length > 0 ? (
                            uniformOrders.filter(o => o.user_id === user.id).map(order => (
                              <div key={order.id} className="bg-white/80 p-4 rounded-xl border border-sky-200 flex justify-between items-center shadow-sm">
                                <div>
                                  <p className="text-sm font-bold text-gray-900">{order.item}</p>
                                  <p className="text-[10px] text-gray-600 font-mono uppercase">{t('aluno.uniform.status')} {order.status === 'pending' ? t('aluno.finance.pending') : t('aluno.uniform.confirmed')}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                  {order.status !== 'pending' ? (
                                    <div className="bg-green-500/20 p-1 rounded-full"><Check className="text-green-500" size={14} /></div>
                                  ) : (
                                    <button
                                      onClick={() => { setSelectedOrderToProof(order); uniformFileInputRef.current?.click(); }}
                                      className="text-[10px] font-black uppercase text-emerald-500 hover:text-emerald-700 bg-emerald-500/5 px-2 py-1 rounded border border-emerald-500/20"
                                    >
                                      {order.proof_url ? t('aluno.finance.change_proof') : t('aluno.finance.pay_now')}
                                    </button>
                                  )}
                                  {order.proof_url && (
                                    <button
                                      onClick={() => handleViewPaymentProof(order.proof_url!, order.item + ' Comprovante', 'payment_proofs')}
                                      className="text-blue-700 hover:text-blue-600 transition-all"
                                      title={t('aluno.finance.view_proof')}
                                    >
                                      <Eye size={18} />
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))
                          ) : (
                            <p className="text-gray-600 text-[10px] italic ml-1">{t('aluno.uniform.empty')}</p>
                          )}
                          <input type="file" ref={uniformFileInputRef} accept="image/*, application/pdf, .heic, .heif" className="hidden" onChange={handleFileChangeForUniformProof} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* --- TAB: NOTAS --- */}
          {activeMainTab === 'grades' && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-sky-100 rounded-xl p-6 border border-sky-300">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Award className="text-blue-500" />
                  {t('aluno.grades.title')}
                </h3>
                <div className="space-y-3">
                  {(studentGrades || []).length > 0 ? (
                    (studentGrades || []).map(g => (
                      <div key={g.id} className="flex items-center justify-between bg-white p-3 rounded border-l-2 border-blue-500">
                        <div className="flex items-center gap-3">
                          <span className="text-gray-600 text-sm">
                            {g.category === 'theory' ? t('aluno.grades.theory') : g.category === 'movement' ? t('aluno.grades.movement') : t('aluno.grades.musicality')}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-gray-900 font-bold">
                            {Number.isFinite(typeof g.numeric === 'number' ? g.numeric : Number(g.numeric))
                              ? (typeof g.numeric === 'number' ? g.numeric : Number(g.numeric)).toFixed(1)
                              : '-'}
                          </span>
                          {/* Written grades hidden for students as requested */}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-600 italic">{t('aluno.grades.empty')}</p>
                  )}
                </div>
                <p className="text-xs text-gray-600 mt-3">
                </p>
              </div>
            </div>
          )}

          {/* --- TAB: TRABALHOS --- */}
          {activeMainTab === 'assignments' && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-sky-100 rounded-xl p-6 border border-sky-300">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <FileText className="text-cyan-500" />
                  {t('aluno.assignments.title')}
                </h3>
                <div className="space-y-3">
                  {myAssignments && myAssignments.length > 0 ? (
                    myAssignments.map(assignment => (
                      <div key={assignment.id} className="bg-white p-4 rounded border-l-2 border-cyan-500">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <div className="flex-1">
                            <h4 className="font-bold text-gray-900 text-sm mb-1">{assignment.title}</h4>
                            <p className="text-gray-600 text-xs mb-2">{assignment.description}</p>
                            <p className="text-gray-600 text-xs">{t('aluno.assignments.due_date')} {assignment.due_date.split('-').reverse().join('/')}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {assignment.status === 'completed' ? (
                              <span className="text-green-700 text-xs flex items-center gap-1 whitespace-nowrap">
                                <Check size={12} /> {t('aluno.assignments.delivered')}
                              </span>
                            ) : (
                              <span className="text-yellow-700 text-xs flex items-center gap-1 whitespace-nowrap">
                                <Clock size={12} /> {t('aluno.finance.pending')}
                              </span>
                            )}
                          </div>
                        </div>
                        {/* Material from Professor */}
                        {assignment.attachment_url && (
                          <Button
                            variant="secondary"
                            className="text-[10px] h-auto px-2 py-1 mt-2 w-full border-cyan-500/30 text-cyan-700"
                            onClick={() => window.open(assignment.attachment_url, '_blank')}
                          >
                            <Eye size={12} className="mr-1" /> {t('aluno.assignments.prof_material')}
                          </Button>
                        )}

                        {/* Student Submission */}
                        {assignment.submission_url && (
                          <Button
                            variant="outline"
                            className="text-[10px] h-auto px-2 py-1 mt-2 w-full border-green-500/30 text-green-700"
                            onClick={() => handleViewAssignment(assignment.submission_url!, assignment.submission_name || 'Trabalho')}
                          >
                            <CheckCircle size={12} className="mr-1" /> {t('aluno.assignments.my_answer')}
                          </Button>
                        )}
                        {/* Submission Button */}
                        {assignment.status !== 'completed' && (
                          <>
                            <Button
                              variant="outline"
                              className="text-xs h-auto px-2 py-1 mt-2 w-full border-cyan-500 text-cyan-500 hover:bg-cyan-900/20"
                              onClick={() => {
                                setSelectedAssignmentToSubmit(assignment);
                                // Small delay for mobile PWA
                                setTimeout(() => assignmentFileInputRef.current?.click(), 100);
                              }}
                              disabled={uploadingAssignment}
                            >
                              {uploadingAssignment && selectedAssignmentToSubmit?.id === assignment.id ? (
                                t('aluno.finance.sending')
                              ) : (
                                <><UploadCloud size={14} className="mr-1" /> {t('aluno.assignments.send_answer')}</>
                              )}
                            </Button>
                            <input
                              type="file"
                              accept=".pdf,.doc,.docx,.jpg,.png,.heic,.heif"
                              className="hidden"
                              ref={assignmentFileInputRef}
                              onChange={handleAssignmentSubmission}
                              disabled={uploadingAssignment}
                            />
                          </>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-600 text-sm italic">Nenhum trabalho atribuído.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* --- TAB: MÚSICAS --- */}
          {activeMainTab === 'music' && (
            <div className="bg-sky-100 rounded-2xl p-8 border border-sky-300 animate-fade-in shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/5 blur-[80px] rounded-full -mr-32 -mt-32"></div>

              <div className="relative z-10">
                <Button variant="ghost" className="mb-4 text-gray-600 p-0 hover:text-gray-900" onClick={() => setActiveMainTab('overview')}>
                  <ArrowLeft size={16} className="mr-2" />
                  Voltar ao Painel
                </Button>
                <div className="flex items-center gap-4 mb-8">
                  <div className="p-3 bg-yellow-500/10 rounded-2xl border border-yellow-500/20 text-yellow-500">
                    <Music size={32} />
                  </div>
                  <div>
                    <h2 className="text-3xl font-black text-gray-900 tracking-tighter uppercase">{t('aluno.music.title')}</h2>
                    <p className="text-gray-600 text-sm">{t('aluno.music.subtitle')}</p>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {musicList.length > 0 ? (
                    musicList.map(m => (
                      <div key={m.id} className="bg-white/80 backdrop-blur-sm p-5 rounded-2xl border-2 border-sky-200 hover:border-yellow-500/30 transition-all group flex flex-col justify-between h-full">
                        <div>
                          <div className="flex justify-between items-start mb-3">
                            <div className="max-w-[80%]">
                              <p className="text-gray-900 font-black leading-tight group-hover:text-yellow-700 transition-colors line-clamp-2">{m.title}</p>
                              <span className="text-[9px] font-black bg-sky-100 text-gray-600 px-2 py-0.5 rounded uppercase tracking-widest border border-sky-300 inline-block mt-1">
                                {m.category}
                              </span>
                            </div>
                            {/* Audio player removed */}
                          </div>
                          {m.lyrics && (
                            <div className="mt-2 p-3 bg-black/40 rounded-xl border border-sky-200 group-hover:border-sky-300 transition-all">
                              <p className="text-gray-600 text-[11px] leading-relaxed whitespace-pre-line line-clamp-4 font-medium italic">
                                {m.lyrics}
                              </p>
                            </div>
                          )}
                        </div>

                        <div className="flex justify-between items-center mt-4 pt-4 border-t border-sky-200">
                          <span className="text-[9px] font-bold text-gray-600 flex items-center gap-1">
                            <Clock size={10} /> {new Date(m.created_at || Date.now()).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full py-20 bg-white/30 rounded-3xl border-2 border-dashed border-sky-200 flex flex-col items-center justify-center">
                      <Music size={48} className="text-stone-700 mb-4 animate-pulse" />
                      <p className="text-gray-600 font-bold uppercase tracking-widest text-sm">{t('aluno.music.empty')}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* --- TAB: TREINO EM CASA --- */}
          {activeMainTab === 'home_training' && (
            <div className="bg-sky-100 rounded-xl p-6 border border-sky-300 animate-fade-in shadow-2xl">
              <Button variant="ghost" className="mb-4 text-gray-600 p-0 hover:text-gray-900" onClick={() => setActiveMainTab('overview')}>
                <ArrowLeft size={16} className="mr-2" />
                {t('common.back_panel')}
              </Button>
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2"><Video size={24} className="text-purple-500" /> {t('training.title')}</h2>

              <div className="bg-white p-4 rounded-lg mb-6 border-l-4 border-orange-500">
                <h3 className="text-lg font-bold text-gray-900 mb-3">{t('training.upload')}</h3>

                <div className="flex gap-2 mb-4">
                  <button
                    onClick={() => setTrainingType('link')}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${trainingType === 'link' ? 'bg-orange-600 text-gray-900' : 'bg-sky-200 text-gray-600'}`}
                  >
                    {t('aluno.training.link')}
                  </button>
                  <button
                    onClick={() => setTrainingType('file')}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${trainingType === 'file' ? 'bg-orange-600 text-gray-900' : 'bg-sky-200 text-gray-600'}`}
                  >
                    {t('aluno.training.upload')}
                  </button>
                </div>

                {trainingType === 'link' ? (
                  <form onSubmit={handleAddTrainingLink} className="space-y-3">
                    <div className="bg-sky-50/50 p-4 rounded-lg border border-sky-300">
                      <label className="block text-xs text-gray-600 mb-2">{t('aluno.training.paste_link')}</label>
                      <input
                        type="url"
                        value={videoLink}
                        onChange={(e) => setVideoLink(e.target.value)}
                        placeholder="https://drive.google.com/..."
                        className="w-full bg-sky-100 border border-sky-300 rounded p-2 text-sm text-gray-900 focus:outline-none focus:border-orange-500"
                        required
                      />
                      <p className="text-[10px] text-gray-600 mt-2">{t('aluno.training.link_hint')}</p>
                    </div>
                    <Button fullWidth type="submit" disabled={uploading || !videoLink}>
                      {uploading ? t('common.saving') : t('training.save_link')}
                    </Button>
                  </form>
                ) : (
                  <div className="border-2 border-dashed border-sky-300 rounded-lg p-6 flex flex-col items-center justify-center bg-sky-50/50 hover:bg-white transition-colors">
                    {uploading ? (
                      <div className="text-center">
                        <UploadCloud size={32} className="text-orange-500 animate-bounce mx-auto mb-2" />
                        <p className="text-gray-900">{t('aluno.training.sending')}</p>
                      </div>
                    ) : (
                      <>
                        <Video size={32} className="text-gray-600 mb-2" />
                        <label className="cursor-pointer">
                          <span className="bg-orange-600 hover:bg-orange-500 text-gray-900 px-4 py-2 rounded-lg text-sm font-medium transition-colors inline-block shadow-lg">
                            {t('aluno.training.select_video')}
                          </span>
                          <input type="file" accept="video/*" className="hidden" onChange={handleUploadVideo} disabled={uploading} />
                        </label>
                        <p className="text-xs text-gray-600 mt-2">{t('aluno.training.video_hint')}</p>
                      </>
                    )}
                  </div>
                )}
              </div>

              <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2"><Clock size={20} className="text-gray-600" /> {t('training.my_videos')}</h3>
              <div className="space-y-3">
                {myHomeTrainings.length > 0 ? (
                  myHomeTrainings.map(training => (
                    <div key={training.id} className="bg-white p-4 rounded-lg border-l-4 border-purple-500 flex justify-between items-center">
                      <div>
                        <p className="font-bold text-gray-900">{training.video_name}</p>
                        <p className="text-gray-600 text-sm">{t('common.sent_on')}: {training.date}</p>
                        <p className="text-gray-600 text-xs">{t('common.expires_on')}: {new Date(training.expires_at).toLocaleDateString('pt-BR')}</p>
                      </div>
                      <Button
                        variant="secondary"
                        className="text-xs h-auto px-3 py-1.5"
                        onClick={() => handleViewVideo(training.video_url, training.video_name)}
                      >
                        <PlayCircle size={16} className="mr-1" /> {t('training.watch')}
                      </Button>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-600 italic text-center py-4">{t('training.empty')}</p>
                )}
              </div>
            </div>
          )}

          {/* --- TAB: BOLETIM --- */}
          {activeMainTab === 'school_report' && (
            <div className="bg-sky-100 rounded-xl p-6 border border-sky-300 animate-fade-in">
              <Button variant="ghost" className="mb-4 text-gray-600 p-0 hover:text-gray-900" onClick={() => setActiveMainTab('overview')}>
                <ArrowLeft size={16} className="mr-2" />
                {t('common.back_panel')}
              </Button>
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2"><GraduationCap size={24} className="text-orange-500" /> {t('report.title')}</h2>

              <div className="bg-white p-4 rounded-lg mb-6 border-l-4 border-orange-500">
                <h3 className="text-lg font-bold text-gray-900 mb-3">{t('report.upload')}</h3>
                <div className="border-2 border-dashed border-sky-300 rounded-lg p-6 flex flex-col items-center justify-center bg-sky-50/50 hover:bg-white transition-colors">
                  {uploadingReport ? (
                    <div className="text-center">
                      <UploadCloud size={32} className="text-orange-500 animate-bounce mx-auto mb-2" />
                      <p className="text-gray-900">{t('aluno.report.sending')}</p>
                    </div>
                  ) : (
                    <>
                      <FileText size={32} className="text-gray-600 mb-2" />
                      <label className="cursor-pointer">
                        <span className="bg-orange-600 hover:bg-orange-500 text-gray-900 px-4 py-2 rounded-lg text-sm font-medium transition-colors inline-block shadow-lg">
                          Selecionar Arquivo
                        </span>
                        <input type="file" accept=".pdf,.doc,.docx,.jpg,.png,.heic,.heif" className="hidden" onChange={handleUploadReport} disabled={uploadingReport} />
                      </label>
                      <p className="text-xs text-gray-600 mt-2">{t('aluno.report.file_hint')}</p>
                    </>
                  )}
                </div>
              </div>

              <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2"><FileText size={20} className="text-gray-600" /> {t('report.my_reports')}</h3>
              <div className="space-y-3">
                {mySchoolReports.length > 0 ? (
                  mySchoolReports.map(report => (
                    <div key={report.id} className="bg-white p-4 rounded-lg border-l-4 border-blue-500 flex justify-between items-center">
                      <div>
                        <p className="font-bold text-gray-900">{report.file_name}</p>
                        <p className="text-gray-600 text-sm">Período: {report.period}</p>
                        <p className="text-gray-600 text-xs">Enviado em: {report.date}</p>
                      </div>
                      <Button variant="secondary" className="text-xs h-auto px-3 py-1.5" onClick={() => handleViewReport(report.file_url, report.file_name)}>
                        <Eye size={16} className="mr-1" /> Ver Boletim
                      </Button>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-600 italic text-center py-4">Nenhum boletim escolar enviado ainda.</p>
                )}
              </div>
            </div>
          )}

          {/* --- TAB: UNIFORME --- */}
          {activeMainTab === 'uniform' && (
            <div className="bg-sky-100 rounded-xl p-6 border border-sky-300 animate-fade-in">
              <Button variant="ghost" className="mb-4 text-gray-600 p-0 hover:text-gray-900" onClick={() => setActiveMainTab('overview')}>
                <ArrowLeft size={16} className="mr-2" />
                Voltar ao Painel
              </Button>
              <div className="bg-white p-4 rounded-lg mb-6 border-l-4 border-orange-500">
                <h3 className="text-lg font-bold text-gray-900 mb-3">Fazer Novo Pedido</h3>
                <form onSubmit={handleOrderUniform} className="space-y-4">
                  <div>
                    <label htmlFor="item" className="block text-sm text-gray-600 mb-1">Item</label>
                    <select
                      id="item"
                      value={orderForm.item}
                      onChange={e => setOrderForm({ ...orderForm, item: e.target.value })}
                      className="w-full bg-sky-100 border border-sky-300 rounded p-2 text-gray-900"
                    >
                      <option value="combo">Combo (Blusa + Calça)</option>
                      <option value="shirt">Blusa Oficial</option>
                      <option value="pants_roda">Calça de Roda</option>
                      <option value="pants_train">Calça de Treino</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {(orderForm.item === 'shirt' || orderForm.item === 'combo') && (
                      <div>
                        <label htmlFor="shirtSize" className="block text-sm text-gray-600 mb-1">Tamanho da Blusa</label>
                        <input
                          id="shirtSize"
                          type="text"
                          placeholder="Ex: P, M, G, GG"
                          value={orderForm.shirtSize}
                          onChange={(e) => setOrderForm({ ...orderForm, shirtSize: e.target.value })}
                          className="w-full bg-sky-100 border border-sky-300 rounded p-2 text-gray-900"
                          required={orderForm.item === 'shirt' || orderForm.item === 'combo'}
                        />
                      </div>
                    )}
                    {(orderForm.item === 'pants_roda' || orderForm.item === 'pants_train' || orderForm.item === 'combo') && (
                      <div>
                        <label htmlFor="pantsSize" className="block text-sm text-gray-600 mb-1">Tamanho da Calça</label>
                        <input
                          id="pantsSize"
                          type="text"
                          placeholder="Ex: 38, 40, 42, 44"
                          value={orderForm.pantsSize}
                          onChange={(e) => setOrderForm({ ...orderForm, pantsSize: e.target.value })}
                          className="w-full bg-sky-100 border border-sky-300 rounded p-2 text-gray-900"
                          required={orderForm.item === 'pants_roda' || orderForm.item === 'pants_train' || orderForm.item === 'combo'}
                        />
                      </div>
                    )}
                  </div>
                  <div className="text-right text-gray-900 font-bold text-lg">
                    Total: R$ {getCurrentPrice().toFixed(2).replace('.', ',')}
                  </div>
                  <Button fullWidth type="submit">
                    <ShoppingBag size={18} className="mr-1" /> Fazer Pedido
                  </Button>
                </form>
              </div>

              <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2"><ShoppingBag size={20} className="text-gray-600" /> Meus Pedidos</h3>
              <div className="space-y-3">
                {myOrders.length > 0 ? (
                  myOrders.map(order => (
                    <div key={order.id} className="bg-white p-4 rounded-lg border-l-4 border-blue-500">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold text-gray-900">{order.item}</p>
                          <p className="text-gray-600 text-sm">
                            {order.shirt_size && `Blusa: ${order.shirt_size}`}
                            {order.shirt_size && order.pants_size && ', '}
                            {order.pants_size && `Calça: ${order.pants_size}`}
                          </p>
                          <p className="text-gray-600 text-xs">Pedido em: {order.date}</p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span className="text-green-700 font-bold">{order.total > 0 ? `R$ ${order.total.toFixed(2).replace('.', ',')}` : 'Sob consulta'}</span>
                          {order.status === 'pending' && <span className="px-2 py-1 rounded bg-yellow-900/30 text-yellow-700 text-xs border border-yellow-900/50">Pendente</span>}
                          {order.status === 'ready' && <span className="px-2 py-1 rounded bg-blue-900/30 text-blue-700 text-xs border border-sky-300">Pago/Pronto</span>}
                          {order.status === 'delivered' && <span className="px-2 py-1 rounded bg-green-900/30 text-green-700 text-xs border border-green-900/50">Entregue</span>}
                        </div>
                      </div>

                      {/* Proof actions */}
                      <div className="mt-3 flex flex-wrap items-center gap-2 pt-3 border-t border-sky-300">
                        {order.status === 'pending' && !order.proof_url && (
                          <>
                            <Button
                              variant="secondary"
                              className="text-xs h-auto px-3 py-1.5"
                              onClick={() => {
                                setSelectedOrderToProof(order);
                                // Small delay to ensure state is set before click (fixes mobile PWA issue)
                                setTimeout(() => uniformFileInputRef.current?.click(), 100);
                              }}
                              disabled={uploadingUniformProof}
                            >
                              {uploadingUniformProof && selectedOrderToProof?.id === order.id ? 'Enviando...' : <><FileUp size={14} className="mr-1" /> Enviar Comprovante</>}
                            </Button>
                            <input
                              type="file"
                              accept="image/*, application/pdf, .heic, .heif"
                              className="hidden"
                              ref={uniformFileInputRef}
                              onChange={handleFileChangeForUniformProof}
                              disabled={uploadingUniformProof}
                            />
                          </>
                        )}
                        {order.proof_url && (
                          <>
                            <button
                              onClick={() => window.open(order.proof_url, '_blank')}
                              className="text-blue-700 hover:text-blue-600 text-xs flex items-center gap-1"
                            >
                              <Eye size={14} /> Ver Comprovante
                            </button>
                            {order.status === 'pending' && (
                              <span className="text-yellow-700 text-xs flex items-center gap-1">
                                <Clock size={12} /> Aguardando Confirmação
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-600 italic text-center py-4">Nenhum pedido de uniforme realizado ainda.</p>
                )}
              </div>
            </div>
          )}

          {activeMainTab === 'store' && (
            <div className="bg-sky-100 rounded-xl p-6 border border-sky-300 animate-fade-in">
              <Button variant="ghost" className="mb-4 text-gray-600 p-0 hover:text-gray-900" onClick={() => setActiveMainTab('overview')}>
                <ArrowLeft size={16} className="mr-2" />
                Voltar ao Painel
              </Button>
              <div className="flex items-center justify-between gap-4 mb-6">
                <div>
                  <h3 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                    <ShoppingBag className="text-amber-600" /> Nossa Loja Virtual
                  </h3>
                  <p className="text-sm text-gray-600">Itens especiais e personalizados do grupo.</p>
                </div>
                <span className="text-[10px] font-black bg-white border border-sky-200 px-3 py-1 rounded-full text-gray-600">{uniformItems.length} ITENS</span>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {uniformItems.length > 0 ? (
                  uniformItems.map(item => (
                    <div key={item.id} className="bg-white rounded-2xl border border-sky-200 overflow-hidden shadow-sm">
                      <img src={item.image_url} alt={item.title} className="w-full h-44 object-cover bg-sky-100" />
                      <div className="p-4 space-y-3">
                        <div>
                          <h4 className="font-black text-gray-900">{item.title}</h4>
                          <p className="text-sm font-bold text-emerald-700">{item.price != null ? `R$ ${Number(item.price).toFixed(2).replace('.', ',')}` : 'Sob consulta'}</p>
                        </div>
                        {item.description && <p className="text-gray-600 text-sm line-clamp-3">{item.description}</p>}
                        <Button fullWidth onClick={() => handleOrderStoreItem(item)}>
                          <ShoppingBag size={16} className="mr-2" /> Pedir este item
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="sm:col-span-2 lg:col-span-3 py-16 bg-white rounded-2xl border-2 border-dashed border-sky-300 text-center text-gray-600 font-bold">
                    Nenhum item cadastrado ainda.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── APPoints ── */}
          {activeMainTab === 'appoints' && (
            <APPoints user={user} allUsersProfiles={allUsersProfiles} />
          )}
        </div>
      </div>
    </div>
  );
};


