# 🏛️ 01. Arsitektur & Overview Aplikasi

Dokumen ini menjelaskan rancangan arsitektur sistem, pembagian lapisan (*layering*), teknologi pendukung, dan skema basis data yang digunakan pada aplikasi GoFood Clone hingga tahap Production Readiness (Day 3).

---

## 1. Arsitektur Tingkat Tinggi (High-Level Architecture)

Aplikasi dibangun menggunakan pola arsitektur **Client-Server Terdistribusi** yang memisahkan antara frontend aplikasi mobile dengan backend API, Real-time engine, dan Push Notification Service.

```mermaid
graph TD
    subgraph Mobile Client ["Mobile App (React Native Expo SDK 57)"]
        UI["UI Screens (Login, Home, Detail, Checkout, Simulator, History, Tracking)"]
        CTX["Context API (AuthContext + CartContext)"]
        RDX["Redux Toolkit (orderSlice)"]
        AXIOS["Axios HTTP Client + Interceptor"]
        SOCK_C["Socket.io Client Engine"]
        ASYNC["AsyncStorage (Device Cache)"]
        NOTIF_C["expo-notifications (Push Token & Foreground Handler)"]
    end

    subgraph Backend Server ["Backend Server (Node.js + Express + TypeScript)"]
        ROUTER["Express Router (/api/auth, /api/restaurants, /api/orders, /api/devices, /api/payments)"]
        AUTH_MID["JWT Auth Middleware"]
        CTRL["Controllers (Auth, Restaurant, Order, Device, Payment)"]
        NOTIF_S["Notification Service (Event-based & Expo Push Client)"]
        PRISMA["Prisma ORM Client"]
        SOCK_S["Socket.io Server (Rooms: order:{id})"]
        TEST["Jest Test Runner (calculateTotal.test.ts)"]
    end

    subgraph External Services ["External Cloud Services"]
        EXPO_PUSH["Expo Push Notification Gateway"]
        OSM["OpenStreetMap Tile Server"]
    end

    subgraph Database ["Database Layer"]
        PG[("PostgreSQL Database (User, Order, Payment, DeviceToken, etc)")]
    end

    UI --> CTX
    UI --> RDX
    UI --> NOTIF_C
    CTX --> ASYNC
    CTX --> AXIOS
    RDX --> AXIOS
    UI --> SOCK_C
    UI -.->|Load Map Tiles| OSM

    AXIOS -->|HTTP REST + Bearer Token| ROUTER
    ROUTER --> AUTH_MID
    AUTH_MID --> CTRL
    CTRL --> PRISMA
    CTRL --> NOTIF_S
    PRISMA -->|SQL Query / Migrations| PG

    NOTIF_S -->|HTTP POST Payload| EXPO_PUSH
    EXPO_PUSH -.->|Remote Push| NOTIF_C

    SOCK_C <-->|WebSocket Bidirectional / Rooms| SOCK_S
```

---

## 2. Peta Teknologi (Technology Stack)

### **A. Backend**
| Teknologi | Kegunaan |
|---|---|
| **Node.js + Express** | Web framework untuk menangani routing REST API, body parsing, dan middleware |
| **TypeScript** | Static typing untuk menjamin keandalan kode dan mencegah runtime errors |
| **Prisma ORM** | Object-Relational Mapper untuk berinteraksi dengan PostgreSQL secara type-safe |
| **PostgreSQL** | Database relasional penyimpanan User, Restaurant, MenuItem, Order, OrderItem, DeviceToken, dan Payment |
| **Bcryptjs** | Library hashing kata sandi satu arah dengan salt untuk keamanan akun |
| **JSON Web Token (JWT)** | Token stateless berbasis klaim untuk proses otentikasi & otorisasi request |
| **Socket.io** | Engine komunikasi real-time berbasis WebSocket dengan fitur *Rooms* |
| **Jest + ts-jest** | Framework pengujian otomatis (*unit testing*) untuk menguji fungsi kalkulasi bisnis |
| **Expo Push API** | HTTP client untuk mendistribusikan notifikasi push ke perangkat mobile |

### **B. Mobile**
| Teknologi | Kegunaan |
|---|---|
| **React Native (Expo SDK 57)** | Framework cross-platform untuk menghasilkan aplikasi mobile iOS & Android |
| **TypeScript** | Menjamin tipe data state, response API, dan props komponen |
| **React Navigation (Native Stack)** | Manajemen navigasi halaman (screen transitions, auth guard stack) |
| **Context API** | Manajemen state lokal/sederhana (Keranjang belanja & Sesi Auth) |
| **AsyncStorage** | Penyimpanan token JWT dan profil pengguna secara permanen di storage perangkat |
| **Redux Toolkit (@reduxjs/toolkit)** | Manajemen state global terstruktur untuk alur kompleks (Order & Checkout lifecycle) |
| **Axios** | HTTP client untuk request API dengan konfigurasi interceptor otomatis |
| **expo-notifications** | Library resmi Expo untuk manajemen izin notifikasi dan penerimaan push token |
| **Socket.io-Client** | Client socket untuk menerima dan mengirimkan pembaruan koordinat driver |
| **Leaflet + OpenStreetMap** | Peta interaktif bebas lisensi komersial untuk visualisasi lokasi kurir |

---

## 3. Skema Basis Data (Database ERD)

Database dirancang dengan relasi antar entitas yang ketat dan efisien:

```mermaid
erDiagram
    User ||--o{ Order : places
    User ||--o{ DeviceToken : registers
    Order ||--o| Payment : has
    Restaurant ||--o{ MenuItem : offers
    Order ||--|{ OrderItem : contains
    MenuItem ||--o{ OrderItem : "referenced in"

    User {
        String id PK
        String name
        String email UK
        String passwordHash
        String role
        DateTime createdAt
    }

    DeviceToken {
        String id PK
        String userId FK
        String token UK
        String platform
        DateTime createdAt
    }

    Restaurant {
        String id PK
        String name
        String image
        Float rating
        String deliveryTime
        Int deliveryFee
        String[] categories
        Boolean isPromo
        DateTime createdAt
    }

    MenuItem {
        String id PK
        String name
        String description
        Int price
        String image
        Boolean isPopular
        String restaurantId FK
    }

    Order {
        String id PK
        String userId FK
        String status
        Int totalPrice
        DateTime createdAt
    }

    Payment {
        String id PK
        String orderId FK,UK
        Int amount
        String status
        String method
        String transactionId
        DateTime createdAt
    }

    OrderItem {
        String id PK
        String orderId FK
        String menuItemId FK
        Int quantity
        Int price
    }
```

### Penjelasan Relasi:
1. **User ke Order (1 to N)**: Satu user dapat memiliki banyak riwayat pesanan (`User.orders`).
2. **User ke DeviceToken (1 to N)**: Satu user dapat login di lebih dari satu perangkat (misal: Smartphone & Tablet), masing-masing memiliki push token tersendiri (`User.deviceTokens`).
3. **Order ke Payment (1 to 1)**: Satu pesanan memiliki tepat satu transaksi pembayaran yang mencatat status pelunasan (`Order.payment`).
4. **Restaurant ke MenuItem (1 to N)**: Satu restoran memiliki banyak daftar makanan & minuman (`Restaurant.menuItems`).
5. **Order ke OrderItem (1 to N)**: Satu transaksi order memuat satu atau lebih rincian item belanja (`Order.items`).
6. **MenuItem ke OrderItem (1 to N)**: Satu menu item dapat dibeli dalam berbagai pesanan yang berbeda.
