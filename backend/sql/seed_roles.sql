-- Inserts each role only if its slug doesn't exist yet.
-- Assumes tbl_role.role_id is AUTO_INCREMENT.
INSERT INTO tbl_role (role_slug, role_name)
SELECT 'admin', 'Administrator' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM tbl_role WHERE role_slug = 'admin');

INSERT INTO tbl_role (role_slug, role_name)
SELECT 'vet', 'Veterinarian' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM tbl_role WHERE role_slug = 'vet');

INSERT INTO tbl_role (role_slug, role_name)
SELECT 'customer', 'Pet Owner' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM tbl_role WHERE role_slug = 'customer');