# Project Name: CUFinder

## Background & Problems
Universities are large, high-traffic environments where students and staff frequently lose personal belongings such as student ID cards, laptops, keys, wallets, and stationery. At Chulalongkorn University, there is currently no centralized digital system to handle lost and found reports. Existing processes rely on LINE group chats, or word of mouth — all of which are fragmented, slow, and hard to search. Items that are found often go unclaimed simply because the owner never knew they were recovered. This creates frustration for students and unnecessary administrative burden for faculty and security staff.

## Scope of Application
CUFinder is scoped exclusively to the Chulalongkorn University campus. The system serves three types of users: students and staff who have lost an item, students and staff who have found an item, and designated campus admins (e.g. security office, library staff) who physically hold found items. Access is restricted to those with a valid CU student or staff email account.

## Application Features & Functionalities

### 1. Core Features
* **User Authentication** — Login via CU email, with role separation between regular users and admins
* **Post a Lost Item** — Submit a report with photo, description, category, last seen location, and date
* **Post a Found Item** — Submit a found report with photo, item description, where it was found, and where it is currently being held
* **Search & Filter** — Browse listings by category, building/location, and date range
* **Admin Dashboard** — Campus admins can manage items held at their location, mark items as claimed or disposed, and moderate listings

### 2. Advanced Features
* **Auto-Matching** — System automatically suggests potential matches between lost and found posts based on category, location, and keywords
* **Claim Workflow** — A claimant submits a claim; the finder or admin verifies identity before releasing the item
* **Notifications** — In-app and email notifications for new matches, claim updates, and item status changes
* **Campus map view** — pin lost and found items on an interactive map of your university. Great visual demo for your course presentation.

## Limitations
* The application is limited to Chulalongkorn University only and does not support other institutions
* Auto-matching is keyword and category-based and may produce false positives
* Image-based matching is basic and relies on manual description rather than AI image recognition
* The app does not integrate with any physical locker or storage system — pickup is coordinated manually
* No native mobile application; the system is web-only and relies on a responsive browser experience on mobile
* The system cannot guarantee item recovery — it only facilitates communication between parties

## Tech Stack Used
* **Frontend:** React (TypeScript)
* **Backend:** Python — Flask
* **Database:** MongoDB
* **API Architecture:** REST API