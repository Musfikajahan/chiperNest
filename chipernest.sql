-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jan 05, 2025 at 12:57 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `chipernest`
--

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `type` varchar(50) NOT NULL,
  `message` text NOT NULL,
  `severity` varchar(20) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `passwords`
--

CREATE TABLE `passwords` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `website` varchar(255) NOT NULL,
  `username` varchar(255) NOT NULL,
  `password` text NOT NULL,
  `last_updated` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `password_analytics`
--

CREATE TABLE `password_analytics` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `strength_category` varchar(50) DEFAULT NULL,
  `reuse_count` int(11) DEFAULT 0,
  `vulnerabilities` int(11) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `password_c`
--

CREATE TABLE `password_c` (
  `id` int(11) NOT NULL,
  `pass_id` int(11) NOT NULL,
  `email` varchar(70) NOT NULL,
  `link` varchar(255) NOT NULL,
  `passwordd` varchar(255) NOT NULL,
  `strength_checker` int(50) DEFAULT NULL,
  `time_stamp` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `password_c`
--

INSERT INTO `password_c` (`id`, `pass_id`, `email`, `link`, `passwordd`, `strength_checker`, `time_stamp`) VALUES
(3, 3, 'patkheterbatija@gmail.com', 'https://chatgpt.com/c/6772543d-de84-800f-8989-9581e9fbf43a', '$2y$10$1OCzFZvkKdlcdMtL3KCqt.QCCI1vRFdLVSQRt5X4EeELudlVxmscq', 75, '2024-11-30 20:27:24'),
(1, 4, 'musfikajahanmithun7117@gmail.com', 'https://chatgpt.com/c/6772543d-de84-800f-8989-9581e9fbf43a', '$2y$10$Jf12vcJU8fc98/i1FHn9UOFeFNJwTBt1YL4WUD6XDSnf783u9STv2', 50, '2025-01-01 06:20:19'),
(4, 5, 'fokinni420@gmail.com', 'https://chatgpt.com/c/6772543d-de84-800f-8989-9581e9fbf43a', '$2y$10$HTE9rXeM9/CxsW7roeEDMO6VEUpIjXoBzWdTuVsZnm7N.vB1xTOx6', 50, '2024-11-02 22:26:02');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `name` text NOT NULL,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `two_fa_secret` text DEFAULT NULL,
  `backup_codes` text DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `reset_token_hash` varchar(64) DEFAULT NULL,
  `reset_token_expires_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `name`, `email`, `password_hash`, `two_fa_secret`, `backup_codes`, `created_at`, `reset_token_hash`, `reset_token_expires_at`) VALUES
(1, 'Mushfika', 'musfika.jahan@g.bracu.ac.bd', '$2y$10$YUsVlsuq5eseR80.dkGLCucTBkHqlWIXKitQUfIfIhswq.DFl6oK2', NULL, NULL, '2024-12-30 12:27:56', 'f5192d985f8799cdc219723ee29a5ba3808c6e51a2ffac4f35353dd2f3970d54', '2025-01-05 00:55:27'),
(2, 'Nazmul', 'md.nazmul.hasan4@g.bracu.ac.bd', '$2y$10$oWqF7Djy2gobzZ4zZyArm.SSd8KNhcn9j.n/HMtt2di5SNJa3t1cG', NULL, NULL, '2024-12-30 12:45:18', 'baeadbac1abdb5d5f892c66f8dc0e264d413de5a43801cd8018c9b2c54f6a819', '2025-01-05 01:24:06'),
(3, 'Siyam', 'patkheterbatija@gmail.com', '$2y$10$zP8cJoI5h01cJZHPoKN5FeP3JbmXVJVLYH4C0PoAklevOg2XDQYtC', NULL, NULL, '2024-12-31 12:19:09', NULL, NULL),
(4, 'nogen', 'nogen420@gmail.com', '$2y$10$sIAcT5/OEkb1.RF6mLNXU.LGVmo3aDtfaOodClky92LWh55IGsUYe', NULL, NULL, '2025-01-02 15:21:13', NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `user_settings`
--

CREATE TABLE `user_settings` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `preference_key` varchar(50) NOT NULL,
  `preference_value` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `passwords`
--
ALTER TABLE `passwords`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `password_analytics`
--
ALTER TABLE `password_analytics`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `password_c`
--
ALTER TABLE `password_c`
  ADD PRIMARY KEY (`pass_id`),
  ADD KEY `id` (`id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `reset_token_hash` (`reset_token_hash`);

--
-- Indexes for table `user_settings`
--
ALTER TABLE `user_settings`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `passwords`
--
ALTER TABLE `passwords`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `password_analytics`
--
ALTER TABLE `password_analytics`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `password_c`
--
ALTER TABLE `password_c`
  MODIFY `pass_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `user_settings`
--
ALTER TABLE `user_settings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `passwords`
--
ALTER TABLE `passwords`
  ADD CONSTRAINT `passwords_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `password_analytics`
--
ALTER TABLE `password_analytics`
  ADD CONSTRAINT `password_analytics_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `password_c`
--
ALTER TABLE `password_c`
  ADD CONSTRAINT `password_c_ibfk_1` FOREIGN KEY (`id`) REFERENCES `users` (`id`);

--
-- Constraints for table `user_settings`
--
ALTER TABLE `user_settings`
  ADD CONSTRAINT `user_settings_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
