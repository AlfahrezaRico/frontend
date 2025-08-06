-- =====================================================
-- SQL QUERIES UNTUK SUPABASE DASHBOARD
-- =====================================================

-- 1. MELIHAT SEMUA DEPARTEMEN DENGAN STATUS NIK CONFIG
-- Query ini menampilkan semua departemen dan apakah sudah ada konfigurasi NIK
SELECT 
    d.id as department_id,
    d.name as department_name,
    d.description as department_description,
    CASE WHEN dnc.id IS NOT NULL THEN 'Ya' ELSE 'Tidak' END as has_nik_config,
    CASE WHEN dnc.is_active = true THEN 'Aktif' ELSE 'Tidak Aktif' END as nik_config_status,
    COALESCE(dnc.prefix, '-') as current_prefix,
    COALESCE(dnc.current_sequence, 0) as current_sequence,
    COALESCE(dnc.separator, '-') as separator,
    d.created_at,
    d.updated_at
FROM departments d
LEFT JOIN department_nik_config dnc ON d.id = dnc.department_id
ORDER BY d.name;

-- 2. MELIHAT KONFIGURASI NIK PER DEPARTEMEN
-- Query ini menampilkan detail konfigurasi NIK untuk setiap departemen
SELECT 
    dnc.id as config_id,
    d.name as department_name,
    d.description as department_description,
    dnc.prefix,
    dnc.current_sequence,
    dnc.sequence_length,
    dnc.format_pattern,
    dnc.separator,
    CASE WHEN dnc.is_active = true THEN 'Aktif' ELSE 'Tidak Aktif' END as status,
    -- Preview NIK berikutnya
    dnc.prefix || LPAD((dnc.current_sequence + 1)::TEXT, dnc.sequence_length, '0') || dnc.separator as next_nik_preview,
    dnc.created_at,
    dnc.updated_at
FROM department_nik_config dnc
JOIN departments d ON dnc.department_id = d.id
ORDER BY d.name;

-- 3. MELIHAT DEPARTEMEN YANG BELUM ADA KONFIGURASI NIK
-- Query ini menampilkan departemen yang belum memiliki konfigurasi NIK
SELECT 
    d.id as department_id,
    d.name as department_name,
    d.description as department_description,
    d.created_at
FROM departments d
LEFT JOIN department_nik_config dnc ON d.id = dnc.department_id
WHERE dnc.id IS NULL
ORDER BY d.name;

-- 4. MELIHAT DEPARTEMEN DENGAN KONFIGURASI NIK AKTIF
-- Query ini menampilkan hanya departemen yang memiliki konfigurasi NIK aktif
SELECT 
    d.name as department_name,
    d.description as department_description,
    dnc.prefix,
    dnc.current_sequence,
    dnc.sequence_length,
    dnc.separator,
    -- Generate contoh NIK
    dnc.prefix || LPAD(dnc.current_sequence::TEXT, dnc.sequence_length, '0') || dnc.separator as current_nik_example,
    dnc.prefix || LPAD((dnc.current_sequence + 1)::TEXT, dnc.sequence_length, '0') || dnc.separator as next_nik_example
FROM department_nik_config dnc
JOIN departments d ON dnc.department_id = d.id
WHERE dnc.is_active = true
ORDER BY d.name;

-- 5. STATISTIK KONFIGURASI NIK
-- Query ini memberikan statistik tentang konfigurasi NIK
SELECT 
    COUNT(*) as total_departments,
    COUNT(dnc.id) as departments_with_nik_config,
    COUNT(CASE WHEN dnc.is_active = true THEN 1 END) as active_configs,
    COUNT(CASE WHEN dnc.is_active = false THEN 1 END) as inactive_configs,
    COUNT(*) - COUNT(dnc.id) as departments_without_config
FROM departments d
LEFT JOIN department_nik_config dnc ON d.id = dnc.department_id;

-- 6. MELIHAT SEQUENCE TERAKHIR PER DEPARTEMEN
-- Query ini menampilkan sequence terakhir untuk setiap departemen
SELECT 
    d.name as department_name,
    dnc.prefix,
    dnc.current_sequence as last_sequence,
    dnc.sequence_length,
    dnc.separator,
    -- Format NIK terakhir
    dnc.prefix || LPAD(dnc.current_sequence::TEXT, dnc.sequence_length, '0') || dnc.separator as last_nik,
    -- Format NIK berikutnya
    dnc.prefix || LPAD((dnc.current_sequence + 1)::TEXT, dnc.sequence_length, '0') || dnc.separator as next_nik
FROM department_nik_config dnc
JOIN departments d ON dnc.department_id = d.id
WHERE dnc.is_active = true
ORDER BY dnc.current_sequence DESC;

-- 7. MELIHAT DEPARTEMEN DENGAN PREFIX TERTENTU
-- Query ini menampilkan departemen berdasarkan prefix NIK
SELECT 
    dnc.prefix,
    COUNT(*) as department_count,
    STRING_AGG(d.name, ', ') as departments
FROM department_nik_config dnc
JOIN departments d ON dnc.department_id = d.id
WHERE dnc.is_active = true
GROUP BY dnc.prefix
ORDER BY dnc.prefix;

-- 8. MELIHAT RIWAYAT PERUBAHAN KONFIGURASI (jika ada tabel audit)
-- Query ini bisa digunakan jika ada tabel audit untuk tracking perubahan
-- SELECT 
--     dnc.id,
--     d.name as department_name,
--     dnc.prefix,
--     dnc.current_sequence,
--     dnc.updated_at,
--     dnc.updated_by
-- FROM department_nik_config dnc
-- JOIN departments d ON dnc.department_id = d.id
-- ORDER BY dnc.updated_at DESC;

-- 9. QUERY UNTUK TEST GENERATE NIK
-- Query ini untuk testing generate NIK untuk departemen tertentu
-- Ganti 'Operations' dengan nama departemen yang ingin ditest
SELECT 
    d.name as department_name,
    dnc.prefix,
    dnc.current_sequence,
    dnc.sequence_length,
    dnc.separator,
    -- NIK saat ini
    dnc.prefix || LPAD(dnc.current_sequence::TEXT, dnc.sequence_length, '0') || dnc.separator as current_nik,
    -- NIK berikutnya (tanpa update sequence)
    dnc.prefix || LPAD((dnc.current_sequence + 1)::TEXT, dnc.sequence_length, '0') || dnc.separator as next_nik
FROM department_nik_config dnc
JOIN departments d ON dnc.department_id = d.id
WHERE d.name = 'Operations' AND dnc.is_active = true;

-- 10. QUERY UNTUK RESET SEQUENCE DEPARTEMEN
-- Query ini untuk reset sequence ke 1 (hati-hati menggunakan ini)
-- UPDATE department_nik_config 
-- SET current_sequence = 1, updated_at = now()
-- WHERE department_id = (SELECT id FROM departments WHERE name = 'Operations');

-- 11. QUERY UNTUK MENONAKTIFKAN KONFIGURASI DEPARTEMEN
-- Query ini untuk menonaktifkan konfigurasi NIK departemen tertentu
-- UPDATE department_nik_config 
-- SET is_active = false, updated_at = now()
-- WHERE department_id = (SELECT id FROM departments WHERE name = 'Operations');

-- 12. QUERY UNTUK MENGAKTIFKAN KONFIGURASI DEPARTEMEN
-- Query ini untuk mengaktifkan konfigurasi NIK departemen tertentu
-- UPDATE department_nik_config 
-- SET is_active = true, updated_at = now()
-- WHERE department_id = (SELECT id FROM departments WHERE name = 'Operations');

-- =====================================================
-- QUERY UNTUK MANAJEMEN DEPARTEMEN
-- =====================================================

-- 13. MENAMBAH DEPARTEMEN BARU
-- INSERT INTO departments (name, description) 
-- VALUES ('New Department', 'Description for new department');

-- 14. MENAMBAH KONFIGURASI NIK UNTUK DEPARTEMEN BARU
-- INSERT INTO department_nik_config (
--     department_id, 
--     department_name, 
--     prefix, 
--     current_sequence, 
--     sequence_length, 
--     format_pattern, 
--     separator, 
--     is_active
-- ) VALUES (
--     (SELECT id FROM departments WHERE name = 'New Department'),
--     'New Department',
--     'ND',
--     1,
--     3,
--     '{PREFIX}{SEQUENCE}{SEPARATOR}',
--     '---',
--     true
-- );

-- 15. UPDATE KONFIGURASI NIK DEPARTEMEN
-- UPDATE department_nik_config 
-- SET 
--     prefix = 'NEW',
--     sequence_length = 4,
--     separator = '###',
--     updated_at = now()
-- WHERE department_id = (SELECT id FROM departments WHERE name = 'Operations');

-- =====================================================
-- QUERY UNTUK VALIDASI
-- =====================================================

-- 16. VALIDASI FORMAT NIK
-- Query ini untuk test apakah NIK sesuai format
-- SELECT 
--     'IT001---' as test_nik,
--     CASE 
--         WHEN 'IT001---' ~ '^IT[0-9]{3}---$' THEN 'Valid'
--         ELSE 'Invalid'
--     END as validation_result;

-- 17. MELIHAT SEMUA FORMAT NIK YANG AKTIF
-- Query ini menampilkan semua format NIK yang aktif
SELECT 
    d.name as department_name,
    dnc.prefix,
    dnc.sequence_length,
    dnc.separator,
    '^' || dnc.prefix || '[0-9]{' || dnc.sequence_length || '}' || dnc.separator || '$' as regex_pattern,
    dnc.prefix || '001' || dnc.separator as example_nik
FROM department_nik_config dnc
JOIN departments d ON dnc.department_id = d.id
WHERE dnc.is_active = true
ORDER BY d.name; 