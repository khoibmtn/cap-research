import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Save, Loader2, Edit, ArrowLeft, Printer, Trash2, XCircle } from 'lucide-react';
import { patientService } from '../services/patientService';
import { useCalculatedIndices } from '../hooks/useCalculatedIndices';
import { usePSICalculator } from '../hooks/usePSICalculator';
import type { Patient } from '../types/patient';
import { createDefaultPatient } from '../types/patient';
import { usePrintRecord } from '../hooks/usePrintRecord';
import StepHanhChinh from '../components/form/StepHanhChinh';
import StepTienSu from '../components/form/StepTienSu';
import StepLamSang from '../components/form/StepLamSang';
import StepXetNghiem from '../components/form/StepXetNghiem';
import StepHinhAnh from '../components/form/StepHinhAnh';
import StepViKhuan from '../components/form/StepViKhuan';
import StepPSI from '../components/form/StepPSI';
import StepKetCuc from '../components/form/StepKetCuc';
import toast from 'react-hot-toast';
import { useEditGuardRegister, useEditGuardConfirm } from '../contexts/EditGuardContext';

const STEPS = [
    { key: 'hanh-chinh', label: 'Hành chính' },
    { key: 'tien-su', label: 'Tiền sử' },
    { key: 'lam-sang', label: 'Lâm sàng' },
    { key: 'xet-nghiem', label: 'Xét nghiệm' },
    { key: 'hinh-anh', label: 'Hình ảnh' },
    { key: 'vi-khuan', label: 'Vi khuẩn' },
    { key: 'psi', label: 'PSI' },
    { key: 'ket-cuc', label: 'Kết cục' },
];

type FormData = Omit<Patient, 'id' | 'createdAt' | 'updatedAt'>;

export default function PatientFormPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const isEdit = !!id && id !== 'new';
    const readOnly = isEdit && !location.pathname.endsWith('/edit');

    const [currentStep, setCurrentStep] = useState(0);
    const [formData, setFormData] = useState<FormData>(createDefaultPatient());
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [existingCodes, setExistingCodes] = useState<Set<string>>(new Set());

    // All patients list for prev/next navigation
    const [allPatients, setAllPatients] = useState<Patient[]>([]);
    // Print hook
    const { printPatients } = usePrintRecord();
    // Snapshot of saved data to detect unsaved changes
    const savedDataRef = useRef<string>('');
    const [isDirty, setIsDirty] = useState(false);

    // Auto-calculated indices
    const indices = useCalculatedIndices({
        neutrophil: formData.xetNghiem.neutrophil,
        lymphocyte: formData.xetNghiem.lymphocyte,
        plt: formData.xetNghiem.plt,
        crp: formData.xetNghiem.crp,
        albumin: formData.xetNghiem.albumin,
    });

    // PSI calculator
    const psiResult = usePSICalculator({
        tuoi: formData.hanhChinh.tuoi,
        gioiTinh: formData.hanhChinh.gioiTinh,
        criteria: formData.psi.criteria,
    });

    // NOTE: Calculated values (indices, PSI) are injected at save time
    // to avoid cascading re-renders that steal input focus.

    // Load existing patient for edit, AND fetch all codes for auto-generation
    useEffect(() => {
        const init = async () => {
            try {
                const patients = await patientService.getAll();
                setAllPatients(patients);
                const codes = new Set(patients.map((p) => p.maBenhNhanNghienCuu).filter(Boolean));
                setExistingCodes(codes);

                if (isEdit) {
                    const patient = await patientService.getById(id);
                    if (patient) {
                        const { id: _, createdAt, updatedAt, ...data } = patient;
                        setFormData(data as FormData);
                        savedDataRef.current = JSON.stringify(data);
                        setIsDirty(false);
                    }
                } else {
                    // Auto-generate next CAPxxx for new patient
                    let maxNum = 0;
                    codes.forEach((c) => {
                        const match = c.match(/^CAP(\d+)$/i);
                        if (match) {
                            const num = parseInt(match[1], 10);
                            if (num > maxNum) maxNum = num;
                        }
                    });
                    const nextCode = `CAP${String(maxNum + 1).padStart(3, '0')}`;
                    const newData = { ...createDefaultPatient(), maBenhNhanNghienCuu: nextCode };
                    setFormData(newData);
                    // Save initial snapshot for dirty detection on new patient
                    savedDataRef.current = JSON.stringify(newData);
                }
            } catch (err) {
                console.error('Failed to init form:', err);
            } finally {
                setLoading(false);
            }
        };
        init();
    }, [id, isEdit]);

    // Track dirty state (for both new and edit modes)
    const isDirtyRef = useRef(false);
    useEffect(() => {
        if (readOnly) return;
        const currentSnapshot = JSON.stringify(formData);
        const dirty = savedDataRef.current !== '' && currentSnapshot !== savedDataRef.current;
        setIsDirty(dirty);
        isDirtyRef.current = dirty;
    }, [formData, readOnly]);

    // Keep a ref to handleSave so the guard always calls the latest version
    const handleSaveRef = useRef<() => Promise<boolean>>(async () => false);

    // Block browser close/refresh when there are unsaved changes
    useEffect(() => {
        const handler = (e: BeforeUnloadEvent) => {
            if (!isDirtyRef.current) return;
            e.preventDefault();
            e.returnValue = '';
        };
        window.addEventListener('beforeunload', handler);
        return () => window.removeEventListener('beforeunload', handler);
    }, []);

    // Register guard for sidebar/back navigation interception
    const registerGuard = useEditGuardRegister();
    const showConfirm = useEditGuardConfirm();
    const showConfirmRef = useRef(showConfirm);
    showConfirmRef.current = showConfirm;

    useEffect(() => {
        if (readOnly) {
            registerGuard(null);
            return;
        }
        registerGuard(async () => {
            if (!isDirtyRef.current) return true;
            const answer = await showConfirmRef.current(
                'Bạn có thay đổi chưa lưu. Bạn có muốn lưu trước khi rời trang không?'
            );
            if (answer) {
                const ok = await handleSaveRef.current();
                return ok;
            }
            return true; // discard changes
        });
        return () => registerGuard(null);
    }, [readOnly, registerGuard]);

    // Cancel handler for both edit and new mode
    const handleCancel = async () => {
        if (isDirtyRef.current) {
            const answer = await showConfirm(
                'Bạn có thay đổi chưa lưu. Bạn có muốn lưu trước khi rời trang không?'
            );
            if (answer) {
                const ok = await handleSave();
                if (!ok) return; // Save failed, stay on page
                return;
            }
        }
        // Discard and navigate away
        setIsDirty(false);
        isDirtyRef.current = false;
        if (isEdit) {
            if (savedDataRef.current) {
                setFormData(JSON.parse(savedDataRef.current));
            }
            navigate(`/patient/${id}`, { replace: true });
        } else {
            navigate('/', { replace: true });
        }
    };

    const updateField = useCallback(<K extends keyof FormData>(section: K, value: FormData[K]) => {
        setFormData((prev) => ({ ...prev, [section]: value }));
    }, []);

    // Parse date string → Date object (handles dd/mm/yyyy and yyyy-mm-dd)
    const parseDate = (s: string): Date | null => {
        if (!s) return null;
        // yyyy-mm-dd from <input type="date">
        if (s.includes('-')) {
            const d = new Date(s);
            return isNaN(d.getTime()) ? null : d;
        }
        // dd/mm/yyyy
        const parts = s.split('/');
        if (parts.length !== 3) return null;
        const [d, m, y] = parts.map(Number);
        if (!d || !m || !y) return null;
        return new Date(y, m - 1, d);
    };

    const validate = (): boolean => {
        const errors: string[] = [];
        const hc = formData.hanhChinh;

        // ── Required fields (Hành chính) ──
        if (!hc.hoTen.trim()) errors.push('Họ tên không được để trống');
        if (!formData.maBenhAnNoiTru.trim()) errors.push('Mã bệnh án nội trú không được để trống');
        if (hc.tuoi === null || hc.tuoi === undefined) errors.push('Tuổi không được để trống');
        if (!hc.gioiTinh) errors.push('Giới tính không được để trống');

        if (errors.length > 0) {
            toast.error(errors.join('\n'), { duration: 5000, style: { whiteSpace: 'pre-line' } });
            setCurrentStep(0); // Navigate to Hành chính
            return false;
        }

        // ── Date validations ──
        const dateErrors: string[] = [];
        const ngayVao = parseDate(hc.ngayVaoVien);
        const ngayRa = parseDate(hc.ngayRaVien);
        const thoiDiemTC = parseDate(formData.lamSang.thoiDiemTrieuChung);
        const ngayBDKS = parseDate(formData.ketCuc.ngayBatDauKhangSinh);
        const ngayKTKS = parseDate(formData.ketCuc.ngayKetThucKhangSinh);

        // Ngày ra viện >= ngày vào viện
        if (ngayVao && ngayRa && ngayRa < ngayVao) {
            dateErrors.push('Ngày ra viện phải bằng hoặc sau ngày nhập viện');
        }

        // Thời điểm triệu chứng <= ngày vào viện
        if (thoiDiemTC && ngayVao && thoiDiemTC > ngayVao) {
            dateErrors.push('Thời điểm triệu chứng phải trước hoặc bằng ngày nhập viện');
        }

        // Ngày bắt đầu kháng sinh >= ngày vào viện
        if (ngayBDKS && ngayVao && ngayBDKS < ngayVao) {
            dateErrors.push('Ngày bắt đầu kháng sinh phải bằng hoặc sau ngày nhập viện');
        }

        // Ngày bắt đầu kháng sinh <= ngày ra viện (nếu có)
        if (ngayBDKS && ngayRa && ngayBDKS > ngayRa) {
            dateErrors.push('Ngày bắt đầu kháng sinh phải trước hoặc bằng ngày ra viện');
        }

        // Ngày kết thúc kháng sinh >= ngày bắt đầu kháng sinh
        if (ngayKTKS && ngayBDKS && ngayKTKS < ngayBDKS) {
            dateErrors.push('Ngày kết thúc kháng sinh phải bằng hoặc sau ngày bắt đầu kháng sinh');
        }

        // Ngày kết thúc kháng sinh <= ngày ra viện (nếu có)
        if (ngayKTKS && ngayRa && ngayKTKS > ngayRa) {
            dateErrors.push('Ngày kết thúc kháng sinh phải trước hoặc bằng ngày ra viện');
        }

        if (dateErrors.length > 0) {
            toast.error(dateErrors.join('\n'), { duration: 6000, style: { whiteSpace: 'pre-line' } });
            return false;
        }

        return true;
    };

    const handleSave = async (): Promise<boolean> => {
        if (!validate()) return false;

        // Inject calculated values at save time (not in useEffect to avoid focus loss)
        const dataToSave: FormData = {
            ...formData,
            hanhChinh: { ...formData.hanhChinh, hoTen: formData.hanhChinh.hoTen.toUpperCase() },
            chiSoTinhToan: { nlr: indices.nlr, plr: indices.plr, car: indices.car },
            psi: { ...formData.psi, tongDiem: psiResult.tongDiem, phanTang: psiResult.phanTang },
        };

        setSaving(true);
        try {
            if (isEdit) {
                await patientService.update(id, dataToSave);
                toast.success('Đã cập nhật bệnh nhân');
                // Return to view mode after saving
                navigate(`/patient/${id}`, { replace: true });
            } else {
                const newId = await patientService.create(dataToSave);
                toast.success('Đã thêm bệnh nhân mới');
                // Navigate to the new patient's edit page
                navigate(`/patient/${newId}/edit`, { replace: true });
            }
            savedDataRef.current = JSON.stringify(dataToSave);
            setIsDirty(false);
            return true;
        } catch (err) {
            toast.error('Lỗi khi lưu dữ liệu');
            console.error(err);
            return false;
        } finally {
            setSaving(false);
        }
    };
    handleSaveRef.current = handleSave;

    /* ───────── Print & Delete ───────── */
    const handlePrint = async () => {
        if (!id) return;
        const patient = await patientService.getById(id);
        if (patient) printPatients([patient]);
    };

    const handleDeletePatient = async () => {
        if (!id) return;
        const name = formData.hanhChinh.hoTen || formData.maBenhNhanNghienCuu;
        const ok = await showConfirm(
            `Bạn có chắc muốn xóa bệnh nhân "${name}"?\nThao tác này không thể hoàn tác.`,
            'Xóa',
            'Hủy',
            { title: 'Xóa bệnh nhân', destructive: true },
        );
        if (!ok) return;
        try {
            await patientService.delete(id);
            toast.success('Đã xóa bệnh nhân');
            navigate('/');
        } catch {
            toast.error('Lỗi khi xóa');
        }
    };

    /* ───────── Prev / Next patient navigation ───────── */
    const currentIndex = isEdit ? allPatients.findIndex((p) => p.id === id) : -1;
    const prevPatient = currentIndex > 0 ? allPatients[currentIndex - 1] : null;
    const nextPatient = currentIndex >= 0 && currentIndex < allPatients.length - 1 ? allPatients[currentIndex + 1] : null;

    const navigateToPatient = async (targetId: string) => {
        if (isDirty) {
            const answer = await showConfirm(
                'Bạn có thay đổi chưa lưu. Bạn có muốn lưu trước khi chuyển sang bệnh nhân khác không?',
                'Lưu',
                'Bỏ thay đổi',
                { title: 'Thay đổi chưa lưu' },
            );
            if (answer) {
                const ok = await handleSave();
                if (!ok) return; // Save failed, stay on current
            }
        }
        // Navigate to the same mode (view or edit) for the target patient
        const suffix = !readOnly && isEdit ? '/edit' : '';
        navigate(`/patient/${targetId}${suffix}`);
    };

    /* ───────── Patient info string ───────── */
    const patientCode = formData.maBenhNhanNghienCuu || '';
    const patientName = formData.hanhChinh.hoTen ? formData.hanhChinh.hoTen.toUpperCase() : '';
    const patientAge = formData.hanhChinh.tuoi;
    const patientInfoParts = [patientCode, patientName].filter(Boolean);
    const patientInfoStr = patientInfoParts.join(' ');
    const patientAgeStr = patientAge !== null && patientAge !== undefined ? `, ${patientAge} tuổi` : '';

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
            </div>
        );
    }

    const renderStep = () => {
        switch (currentStep) {
            case 0: return <StepHanhChinh data={formData} onChange={updateField} existingCodes={existingCodes} currentPatientId={isEdit ? id : undefined} />;
            case 1: return <StepTienSu data={formData.tienSu} onChange={(v) => updateField('tienSu', v)} />;
            case 2: return <StepLamSang data={formData.lamSang} ngayVaoVien={formData.hanhChinh.ngayVaoVien} onChange={(v) => updateField('lamSang', v)} />;
            case 3: return <StepXetNghiem data={formData.xetNghiem} indices={indices} onChange={(v) => updateField('xetNghiem', v)} />;
            case 4: return <StepHinhAnh data={formData.hinhAnh} onChange={(v) => updateField('hinhAnh', v)} />;
            case 5: return <StepViKhuan data={formData.viKhuan} onChange={(v) => updateField('viKhuan', v)} />;
            case 6: return <StepPSI data={formData.psi} tuoi={formData.hanhChinh.tuoi} gioiTinh={formData.hanhChinh.gioiTinh} lamSang={formData.lamSang} xetNghiem={formData.xetNghiem} tienSu={formData.tienSu} hinhAnh={formData.hinhAnh} psiResult={psiResult} onChange={(v) => updateField('psi', v)} />;
            case 7: return <StepKetCuc data={formData.ketCuc} ngayVaoVien={formData.hanhChinh.ngayVaoVien} ngayRaVien={formData.hanhChinh.ngayRaVien} onChange={(v) => updateField('ketCuc', v)} />;
            default: return null;
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-6">
                {/* Row 1: Back button + Title + Edit button */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={async () => {
                            if (isDirty) {
                                const answer = await showConfirm(
                                    'Bạn có thay đổi chưa lưu. Bạn có muốn lưu trước khi rời trang không?'
                                );
                                if (answer) {
                                    const ok = await handleSave();
                                    if (ok) navigate('/');
                                    return;
                                }
                            }
                            navigate('/');
                        }}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors flex-shrink-0"
                        title="Quay lại danh sách"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <h1 className="font-heading text-xl font-bold text-gray-900 flex-1">
                        {readOnly ? 'Xem chi tiết bệnh nhân' : isEdit ? 'Chỉnh sửa bệnh nhân' : 'Thêm bệnh nhân mới'}
                    </h1>
                    {readOnly && isEdit && (
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handlePrint}
                                className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                                title="In bệnh án nghiên cứu"
                            >
                                <Printer className="w-4 h-4" />
                                In BANC
                            </button>
                            <button
                                onClick={() => navigate(`/patient/${id}/edit`)}
                                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-xl hover:bg-primary-700 transition-colors shadow-sm"
                            >
                                <Edit className="w-4 h-4" />
                                Chỉnh sửa
                            </button>
                            <button
                                onClick={handleDeletePatient}
                                className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-red-600 bg-white border border-red-200 rounded-xl hover:bg-red-50 transition-colors"
                                title="Xóa bệnh nhân"
                            >
                                <Trash2 className="w-4 h-4" />
                                Xóa
                            </button>
                        </div>
                    )}
                    {(!readOnly && isEdit || !isEdit) && (
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleCancel}
                                disabled={saving}
                                className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-50 transition-colors"
                            >
                                <XCircle className="w-4 h-4" />
                                Huỷ
                            </button>
                            <button
                                onClick={() => handleSave()}
                                disabled={saving}
                                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-xl hover:bg-primary-700 disabled:opacity-50 transition-colors shadow-sm"
                            >
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                Lưu
                            </button>
                        </div>
                    )}
                </div>

                {/* Row 2: Patient info with prev/next navigation */}
                {isEdit && patientCode && (
                    <div className="flex items-center gap-3 mt-2 ml-11">
                        {/* Prev button */}
                        <button
                            onClick={() => prevPatient && navigateToPatient(prevPatient.id)}
                            disabled={!prevPatient || !readOnly}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-primary-200 bg-primary-50 text-primary-600 hover:bg-primary-100 hover:text-primary-800 hover:border-primary-300 hover:shadow-sm active:scale-95 disabled:opacity-25 disabled:cursor-not-allowed disabled:hover:shadow-none transition-all flex-shrink-0"
                            title={!readOnly ? 'Lưu hoặc huỷ chỉnh sửa trước khi chuyển BN' : prevPatient ? `← ${prevPatient.maBenhNhanNghienCuu}` : 'Không có BN trước'}
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>

                        {/* Patient info */}
                        <p className="text-sm text-primary-700 font-bold tracking-wide select-none">
                            {patientInfoStr}{patientAgeStr}
                        </p>

                        {/* Next button */}
                        <button
                            onClick={() => nextPatient && navigateToPatient(nextPatient.id)}
                            disabled={!nextPatient || !readOnly}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-primary-200 bg-primary-50 text-primary-600 hover:bg-primary-100 hover:text-primary-800 hover:border-primary-300 hover:shadow-sm active:scale-95 disabled:opacity-25 disabled:cursor-not-allowed disabled:hover:shadow-none transition-all flex-shrink-0"
                            title={!readOnly ? 'Lưu hoặc huỷ chỉnh sửa trước khi chuyển BN' : nextPatient ? `→ ${nextPatient.maBenhNhanNghienCuu}` : 'Không có BN tiếp theo'}
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                )}

                {/* For new patient, just show the code + name */}
                {!isEdit && patientCode && (
                    <p className="text-sm text-primary-600 font-semibold tracking-wide mt-1.5 ml-11">
                        {patientInfoStr}{patientAgeStr}
                    </p>
                )}
            </div>

            {/* Step tabs */}
            <div className="mb-6 overflow-x-auto -mx-4 px-4 pb-2">
                <div className="flex gap-1 min-w-max">
                    {STEPS.map((step, i) => (
                        <button
                            key={step.key}
                            onClick={() => setCurrentStep(i)}
                            className={`px-3 py-2 text-xs font-medium rounded-lg whitespace-nowrap transition-colors
                ${i === currentStep
                                    ? 'bg-primary-600 text-white shadow-sm'
                                    : i < currentStep
                                        ? 'bg-primary-50 text-primary-700'
                                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                }`}
                        >
                            <span className="mr-1">{i + 1}.</span>
                            {step.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Step content */}
            <div className={`bg-white rounded-xl border border-gray-200 p-6 mb-6${readOnly ? ' pointer-events-none opacity-80' : ''}`}
                style={readOnly ? { userSelect: 'text' } : undefined}
            >
                {renderStep()}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between">
                <button
                    onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                    disabled={currentStep === 0}
                    className="inline-flex items-center gap-1 px-4 py-2 text-sm font-medium text-gray-600
            bg-white border border-gray-200 rounded-xl hover:bg-gray-50
            disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                    <ChevronLeft className="w-4 h-4" />
                    Trước
                </button>

                <div className="flex gap-2">

                    {currentStep < STEPS.length - 1 && (
                        <button
                            onClick={() => setCurrentStep(Math.min(STEPS.length - 1, currentStep + 1))}
                            className="inline-flex items-center gap-1 px-4 py-2 text-sm font-medium
                text-primary-700 bg-primary-50 rounded-xl hover:bg-primary-100 transition-colors"
                        >
                            Tiếp
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
