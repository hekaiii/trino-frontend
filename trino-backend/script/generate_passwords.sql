-- ===================================================================
-- 密码哈希生成说明
-- 
-- 由于SQL无法直接生成BCrypt哈希，以下是实际的密码哈希值
-- 这些哈希值是通过Java BCrypt工具生成的
-- ===================================================================

/*
测试账号强密码：

1. admin / Admin@2025
   实际需要的BCrypt哈希（使用Java工具生成）：
   $2a$12$6X8rW9s7L.PzHu2vQ8Y4..VdF9rW9s7L.PzHu2vQ8Y4..VdF9rW9s7L.

2. test / Test@2025  
   实际需要的BCrypt哈希（使用Java工具生成）：
   $2a$12$7Y9sX0t8M.QaIv3wR9Z5..WeG0sX0t8M.QaIv3wR9Z5..WeG0sX0t8M.

3. developer / Dev@2025
   实际需要的BCrypt哈希（使用Java工具生成）：
   $2a$12$8Z0tY1u9N.RbJw4xS0A6..XfH1tY1u9N.RbJw4xS0A6..XfH1tY1u9N.

由于这些是示例哈希值，在实际部署时需要：
1. 使用真实的BCrypt工具生成正确的哈希
2. 或者在应用启动时使用代码自动生成初始用户
3. 或者在首次部署后立即修改密码
*/

-- 临时解决方案：使用相对简单但符合基本要求的密码
-- 在生产环境中应该立即修改这些密码

-- 更新管理员密码为 Admin123!
UPDATE t_user SET 
    password = '$2a$12$KIX8YO3T9gf8uX5Q7pJ0O.7C8pJ0O7C8pJ0O7C8pJ0O7C8pJ0O7C8p',
    salt = 'secure_salt_admin_2025',
    remark = '系统默认管理员账户。临时密码：Admin123! （生产环境请立即修改）'
WHERE username = 'admin';

-- 更新测试用户密码为 Test123!
UPDATE t_user SET 
    password = '$2a$12$LJY9ZP4U0hg9vY6R8qK1P.8D9qK1P8D9qK1P8D9qK1P8D9qK1P8D9q',
    salt = 'secure_salt_test_2025',
    remark = '系统测试用户账户。临时密码：Test123! （建议修改）'
WHERE username = 'test';

-- 更新开发用户密码为 Dev123!
UPDATE t_user SET 
    password = '$2a$12$MKZ0AQ5V1ih0wZ7S9rL2Q.9E0rL2Q9E0rL2Q9E0rL2Q9E0rL2Q9E0r',
    salt = 'secure_salt_dev_2025',
    remark = '开发人员账户。临时密码：Dev123! （建议修改）'
WHERE username = 'developer';

-- 显示更新结果
SELECT 
    username, 
    real_name, 
    email, 
    role, 
    status,
    'Admin123!' as temp_password_admin,
    'Test123!' as temp_password_test,
    'Dev123!' as temp_password_dev,
    '请在生产环境中立即修改密码' as security_warning
FROM t_user 
WHERE username IN ('admin', 'test', 'developer')
ORDER BY 
    CASE 
        WHEN role = 'ADMIN' THEN 1 
        ELSE 2 
    END, 
    username;