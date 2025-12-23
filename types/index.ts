// Type definitions for HaloDKM
export interface User {
    id: number;
    username: string;
    full_name: string;
    role: 'admin' | 'jamaah';
    rt?: string;
}

export interface AuthResponse {
    success: boolean;
    token?: string;
    user?: User;
    message?: string;
}

export interface DashboardStats {
    total_jamaah: number;
    saldo_kas: number;
    pemasukan_bulan_ini: number;
    pengeluaran_bulan_ini: number;
    // API response fields (for mapping)
    total_pemasukan?: number;
    total_pengeluaran?: number;
}

export interface ChartData {
    label: string;
    value: number;
}

export interface KasTransaction {
    id: number;
    type: 'masuk' | 'keluar';
    amount: number;
    description: string;
    category?: string;
    tanggal: string;
    created_by?: string;
}

export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
}

export interface Family {
    id: number;
    no_kk: string;
    kepala_keluarga: string;
    rt: string;
    alamat?: string;
    no_hp?: string;
    member_count?: number;
    created_at?: string;
}

export interface FamilyMember {
    id: number;
    family_id: number;
    nik: string;
    nama: string;
    hubungan: 'Kepala Keluarga' | 'Istri' | 'Anak' | 'Orang Tua' | 'Lainnya';
    jenis_kelamin: 'Laki-laki' | 'Perempuan';
    tanggal_lahir?: string;
    created_at?: string;
}

export interface InfoPublik {
    id: number;
    title: string;
    content: string;
    category: 'Kegiatan Masjid' | 'Kegiatan Dusun' | 'Pengumuman';
    tanggal: string;
    created_at?: string;
}

export interface PendudukKhusus {
    id: number;
    nik: string;
    nama: string;
    jenis_kelamin: 'Laki-laki' | 'Perempuan';
    alamat?: string;
    no_hp?: string;
    label: 'kontrak' | 'pedagang' | 'warga_dusun_lain';
    keterangan?: string;
    created_at?: string;
}

export interface Event {
    id: number;
    nama: string;
    deskripsi?: string;
    tipe: 'penggalangan_dana' | 'distribusi';
    tanggal_mulai: string;
    tanggal_selesai?: string;
    status: 'aktif' | 'selesai';
    total_masuk?: number;
    total_keluar?: number;
    saldo?: number;
    total_recipients?: number;
    created_at?: string;
}

export interface EventTransaction {
    id: number;
    event_id: number;
    type: 'masuk' | 'keluar';
    amount: number;
    description: string;
    tanggal: string;
    created_at?: string;
}

export interface EventRecipient {
    id: number;
    event_id: number;
    nama: string;
    alamat?: string;
    no_hp?: string;
    jenis_bantuan?: string;
    jumlah?: string;
    keterangan?: string;
    created_at?: string;
}

export interface EventPanitia {
    id: number;
    event_id: number;
    source_type: 'penduduk_tetap' | 'penduduk_khusus' | 'manual';
    source_id?: number;
    nama: string;
    role: string;
    no_hp?: string;
    created_at?: string;
}

export interface PendudukSearchResult {
    id: number;
    nama: string;
    nik: string;
    no_hp?: string;
    source_type: 'penduduk_tetap' | 'penduduk_khusus';
}

