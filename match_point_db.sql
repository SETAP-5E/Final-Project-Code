-- MySQL dump 10.13  Distrib 8.0.42, for Win64 (x86_64)
--
-- Host: localhost    Database: match_point_db
-- ------------------------------------------------------
-- Server version	8.0.42

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `bookings`
--

DROP TABLE IF EXISTS `bookings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bookings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `court_id` int NOT NULL,
  `booking_date` date NOT NULL,
  `booking_time` time NOT NULL,
  `status` enum('booked','canceled') DEFAULT 'booked',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `court_name` varchar(100) DEFAULT NULL,
  `location` varchar(100) DEFAULT NULL,
  `opponent_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `court_id` (`court_id`),
  CONSTRAINT `bookings_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `bookings_ibfk_2` FOREIGN KEY (`court_id`) REFERENCES `courts` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bookings`
--

LOCK TABLES `bookings` WRITE;
/*!40000 ALTER TABLE `bookings` DISABLE KEYS */;
INSERT INTO `bookings` VALUES (3,1,3,'2025-05-02','10:00:00','booked','2025-05-01 16:59:01','Court A','London',NULL),(4,2,4,'2025-05-03','15:00:00','booked','2025-05-01 16:59:01','Court B','UK',NULL),(5,5,3,'2025-05-05','17:00:00','booked','2025-05-01 18:10:35','Court A','London',NULL),(6,5,4,'2025-05-06','19:00:00','canceled','2025-05-01 18:10:35','Court B','UK',NULL),(7,5,1,'2025-05-05','12:20:00','booked','2025-05-01 18:15:11','Court A','London',NULL),(8,5,1,'2025-05-31','21:00:00','booked','2025-05-05 19:19:48','Court A','London',NULL),(9,5,1,'2025-05-15','15:00:00','canceled','2025-05-06 09:15:11','Court A','London',NULL),(10,8,3,'2025-05-15','15:00:00','booked','2025-05-06 09:18:52','Court D','London',NULL),(11,8,2,'2025-05-15','15:00:00','booked','2025-05-06 09:19:29','Court B','UK',NULL),(12,5,2,'2025-05-06','13:00:00','booked','2025-05-06 11:15:44','Court B','UK',NULL),(13,5,1,'2025-05-15','20:00:00','booked','2025-05-06 11:30:56','Court A','London',NULL),(14,5,1,'2025-05-31','21:00:00','canceled','2025-05-07 13:51:53','Court A','London',4);
/*!40000 ALTER TABLE `bookings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `courts`
--

DROP TABLE IF EXISTS `courts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `courts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) DEFAULT NULL,
  `location` varchar(100) DEFAULT NULL,
  `type` enum('indoor','outdoor') DEFAULT NULL,
  `is_available` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `courts`
--

LOCK TABLES `courts` WRITE;
/*!40000 ALTER TABLE `courts` DISABLE KEYS */;
INSERT INTO `courts` VALUES (1,'Court A','London','indoor',1),(2,'Court B','UK','outdoor',1),(3,'Court D','London','indoor',1),(4,'Court E','UK','outdoor',1);
/*!40000 ALTER TABLE `courts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `friends`
--

DROP TABLE IF EXISTS `friends`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `friends` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `friend_id` int NOT NULL,
  `status` enum('pending','accepted','rejected') DEFAULT 'pending',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `friend_id` (`friend_id`),
  CONSTRAINT `friends_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `friends_ibfk_2` FOREIGN KEY (`friend_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `friends`
--

LOCK TABLES `friends` WRITE;
/*!40000 ALTER TABLE `friends` DISABLE KEYS */;
INSERT INTO `friends` VALUES (3,1,2,'accepted','2025-05-01 16:59:11'),(4,1,3,'pending','2025-05-01 16:59:11'),(5,5,1,'accepted','2025-05-01 18:10:52'),(6,5,2,'accepted','2025-05-01 18:10:52');
/*!40000 ALTER TABLE `friends` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `match_requests`
--

DROP TABLE IF EXISTS `match_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `match_requests` (
  `id` int NOT NULL AUTO_INCREMENT,
  `requester_id` int NOT NULL,
  `opponent_id` int NOT NULL,
  `proposed_date` date DEFAULT NULL,
  `proposed_time` time DEFAULT NULL,
  `status` enum('pending','confirmed','rejected') DEFAULT 'pending',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `requester_id` (`requester_id`),
  KEY `opponent_id` (`opponent_id`),
  CONSTRAINT `match_requests_ibfk_1` FOREIGN KEY (`requester_id`) REFERENCES `users` (`id`),
  CONSTRAINT `match_requests_ibfk_2` FOREIGN KEY (`opponent_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `match_requests`
--

LOCK TABLES `match_requests` WRITE;
/*!40000 ALTER TABLE `match_requests` DISABLE KEYS */;
INSERT INTO `match_requests` VALUES (3,2,3,'2025-05-04','17:00:00','pending','2025-05-01 16:59:21'),(4,1,2,'2025-05-05','18:00:00','confirmed','2025-05-01 16:59:21'),(5,5,2,'2025-05-06','19:00:00','pending','2025-05-01 18:11:10'),(6,5,1,'2025-05-07','20:00:00','confirmed','2025-05-01 18:11:10'),(7,5,4,'2025-05-31','21:00:00','pending','2025-05-07 13:51:53');
/*!40000 ALTER TABLE `match_requests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `matches`
--

DROP TABLE IF EXISTS `matches`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `matches` (
  `id` int NOT NULL AUTO_INCREMENT,
  `player1_id` int NOT NULL,
  `player2_id` int NOT NULL,
  `court_id` int DEFAULT NULL,
  `match_date` date DEFAULT NULL,
  `match_time` time DEFAULT NULL,
  `score` varchar(50) DEFAULT NULL,
  `winner_id` int DEFAULT NULL,
  `location` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `player1_id` (`player1_id`),
  KEY `player2_id` (`player2_id`),
  KEY `court_id` (`court_id`),
  KEY `winner_id` (`winner_id`),
  CONSTRAINT `matches_ibfk_1` FOREIGN KEY (`player1_id`) REFERENCES `users` (`id`),
  CONSTRAINT `matches_ibfk_2` FOREIGN KEY (`player2_id`) REFERENCES `users` (`id`),
  CONSTRAINT `matches_ibfk_3` FOREIGN KEY (`court_id`) REFERENCES `courts` (`id`),
  CONSTRAINT `matches_ibfk_4` FOREIGN KEY (`winner_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `matches`
--

LOCK TABLES `matches` WRITE;
/*!40000 ALTER TABLE `matches` DISABLE KEYS */;
INSERT INTO `matches` VALUES (9,1,2,3,'2025-04-25','10:00:00','6-4, 7-5',1,'London','2025-05-01 16:59:33'),(10,2,3,4,'2025-04-26','15:00:00','6-3, 4-6, 6-2',2,'UK','2025-05-01 16:59:33'),(11,3,1,3,'2025-04-27','09:00:00','7-6, 6-4',3,'London','2025-05-01 16:59:33'),(12,1,3,4,'2025-04-29','18:00:00',NULL,NULL,'UK','2025-05-01 16:59:33'),(13,2,1,3,'2025-04-30','11:30:00','3-6, 6-2, 6-4',2,'London','2025-05-01 16:59:33'),(14,3,2,4,'2025-05-01','17:00:00','4-6, 6-4, 7-5',3,'UK','2025-05-01 16:59:33'),(15,1,2,4,'2025-05-02','19:00:00','6-3, 6-3',1,'UK','2025-05-01 16:59:33'),(16,2,3,3,'2025-05-03','14:00:00',NULL,NULL,'London','2025-05-01 16:59:33'),(17,5,2,3,'2025-05-01','18:00:00','6-3, 6-4',4,'London','2025-05-01 18:11:30'),(18,5,1,4,'2025-05-02','19:30:00','7-5, 6-7, 10-8',1,'UK','2025-05-01 18:11:30'),(19,5,1,1,'2025-05-01','10:00:00','4-6, 6-3, 6-2',5,'London','2025-05-06 09:02:12'),(20,3,5,2,'2025-05-02','11:00:00','6-7, 6-2, 5-7',5,'UK','2025-05-06 09:02:12'),(21,5,4,3,'2025-05-03','09:30:00','2-6, 6-1, 6-4',5,'London','2025-05-06 09:02:12'),(22,6,5,4,'2025-05-04','14:00:00','4-6, 6-4, 3-6',5,'UK','2025-05-06 09:02:16');
/*!40000 ALTER TABLE `matches` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `full_name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `birthdate` date DEFAULT NULL,
  `gender` enum('Male','Female','Other') DEFAULT NULL,
  `phone_number` varchar(20) DEFAULT NULL,
  `country_code` varchar(5) DEFAULT NULL,
  `location` varchar(100) DEFAULT NULL,
  `profile_picture` varchar(255) DEFAULT NULL,
  `strength` tinyint DEFAULT NULL,
  `wins` int DEFAULT '0',
  `losses` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `is_verified` tinyint(1) DEFAULT '0',
  `verification_token` varchar(255) DEFAULT NULL,
  `is_available_for_matchmaking` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'Hassan','hassan@example.com','hashed_password_1','1995-05-01','Male','70123456','+961','London',NULL,5,3,1,'2025-05-01 16:58:48',1,'token123',1),(2,'Hamad','hamad@example.com','hashed_password_2','1992-03-10','Male','71123456','+961','UK',NULL,4,2,2,'2025-05-01 16:58:48',1,'token456',1),(3,'Nayef Al Darwish','nayef@example.com','hashed_password_3','1990-01-20','Male','72123456','+961','Tyre',NULL,6,5,0,'2025-05-01 16:58:48',1,'token789',1),(4,'Nayef Al Darwish','testuser+1@mailtrap.io','$2b$10$cJn7GhchMYYDQYZB6cbRseyga2.8P/OcGNOxFT4ndtNzmZ6Hv7mta',NULL,NULL,NULL,NULL,NULL,NULL,8,5,2,'2025-05-01 17:24:51',0,'ee16fe203feae9520e3af6c6f711b9488cff361414022f3f4a62e054128f8d82',1),(5,'Hassan','hassan@mailtrap.io','$2b$10$sWyVepPAlMU4SxduSnJ6YOFnJxaqs5XrcA.4SZqs6AXtVApp4yz3q','2003-09-19','Male','30976984999','+974','Doha','profile_5.JPG',7,4,2,'2025-05-01 18:03:15',1,NULL,1),(6,'Sarah','sarah@mailtrap.io','$2b$10$t02wEQz/byNVw.VnDWqqYOQk1HNNwR2fdtepx9PD4r.nksd.FN21a','2004-06-10','Female','70972609','+974','London','profile_6.png',0,0,1,'2025-05-01 18:33:23',1,NULL,1),(7,'Sam','sam@mailtrap.io','$2b$10$M5rTy239ZHLuAF4drzMIHOL.2pBcKiAr4DUBYe7UkUuRdF3zLTL3u',NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,'2025-05-06 08:46:46',1,NULL,1),(8,'Lemich','Lemich@mailtrap.io','$2b$10$O2dKuC3v7s6mZo3fxiC/HuMXukAREVwxMvKFj5C.IMtL7821MhPxW','2000-05-15','Male','07831556544','+1','','profile_8.png',NULL,0,0,'2025-05-06 09:17:32',1,NULL,1),(10,'Fenil','fenil@mailtrap.io','$2b$10$s5LkbdQwK3f.YNuZXIrb0u0vfIhjHtNKeISsWUQTtaNXBmuQJadwi',NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,'2025-05-07 13:41:11',1,NULL,1);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-05-07 15:03:54
