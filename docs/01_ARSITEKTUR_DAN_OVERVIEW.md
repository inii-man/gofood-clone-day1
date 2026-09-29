# 🏛️ 01. Arsitektur & Overview Aplikasi

Dokumen ini menjelaskan rancangan arsitektur sistem, pembagian lapisan (layering), teknologi pendukung, dan skema basis data yang digunakan pada aplikasi GoFood Clone.

---

## 1. Arsitektur Tingkat Tinggi (High-Level Architecture)

Aplikasi dibangun menggunakan pola arsitektur **Client-Server Terdistribusi** yang memisahkan antara frontend aplikasi mobile dengan backend API & Real-time engine.

```mermaid
graph TD
    subgraph Mobile Client ["Mobile App (React Native Expo)"]
        UI["UI Screens (Login, Home, Detail, Checkout, Tracking)"]
        CTX["Context API (AuthContext + CartContext)"]
        RDX["Redux Toolkit (orderSlice)"]
        AXIOS["Axios HTTP Client + Interceptor"]
        SOCK_C["Socket.io Client Engine"]
        ASYNC["AsyncStorage (Device Cache)"]
    end

    subgraph Backend Server ["Backend Server (Node.js + Express)"]
        ROUTER["Express Router (/api/auth, /api/restaurants, /api/orders)"]
        AUTH_MID["JWT Auth Middleware"]
        CTRL["Controllers (Auth, Restaurant, Order)"]
        PRISMA["Prisma ORM Client"]
        SOCK_S["Socket.io Server (Rooms: order:{id})"]
    end

    subgraph Database ["Database Layer"]
        PG[("PostgreSQL Database")]
    end

    UI --> CTX
    UI --> RDX
    CTX --> ASYNC
    CTX --> AXIOS
    RDX --> AXIOS
    UI --> SOCK_C

    AXIOS -->|HTTP Request + Bearer Token| ROUTER
    ROUTER --> AUTH_MID
    AUTH_MID --> CTRL
    CTRL --> PRISMA
    PRISMA -->|SQL Query| PG

    SOCK_C <-->|WebSocket Bidirectional / Rooms| SOCK_S
```

---

## 2. Peta Teknologi (Technology Stack)

### **A. Backend**
| Teknologi | Kegunaan |
|---|---|
| **Node.js + Express** | Web framework untuk menangani routing REST API dan middleware |
| **TypeScript** | Static typing untuk menjamin keandalan kode dan mencegah runtime errors |
| **Prisma ORM** | Object-Relational Mapper untuk berinteraksi dengan database PostgreSQL secara type-safe |
| **PostgreSQL** | Database relasional penyimpanan User, Restaurant, MenuItem, Order, dan OrderItem |
| **Bcryptjs** | Library hashing kata sandi satu arah dengan salt untuk keamanan akun |
| **JSON Web Token (JWT)** | Token stateless berbasis klaim untuk proses otentikasi & otorisasi request |
| **Socket.io** | Engine komunikasi real-time berbasis WebSocket dengan fitur *Rooms* dan *Auto-fallback* |

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
| **Socket.io-Client** | Client socket untuk menerima dan mengirimkan pembaruan koordinat driver |

---

## 3. Skema Basis Data (Database ERD)

Database dirancang dengan relasi antar entitas yang ketat dan efisien:

```mermaid
erDiagram
    User ||--o{ Order : places
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

    OrderItem {
        String id PK
        String orderId FK
        String menuItemId FK
        Int quantity
        Int price
    }
```

### Penjelasan Relasi:
1. **User ke Order (1 to N)**: Satu user dapat memiliki banyak order riwayat pemesanan (`User.orders`).
2. **Restaurant ke MenuItem (1 to N)**: Satu restoran memiliki banyak daftar makanan & minuman (`Restaurant.menuItems`).
3. **Order ke OrderItem (1 to N)**: Satu transaksi order memuat satu atau lebih rincian item belanja (`Order.items`).
4. **MenuItem ke OrderItem (1 to N)**: Satu menu item dapat dibeli dalam berbagai pesanan yang berbeda.
