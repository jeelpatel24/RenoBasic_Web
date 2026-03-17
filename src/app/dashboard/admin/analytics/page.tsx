"use client";

import { useState, useEffect } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { HiChartBar, HiUsers, HiClipboardList, HiCreditCard, HiChat, HiCollection, HiShieldCheck, HiLockOpen } from "react-icons/hi";
import {
  PieChart, Pie, Cell, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer,
} from "recharts";

export default function AdminAnalyticsPage() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    homeowners: 0,
    contractors: 0,
    admins: 0,
    verifiedContractors: 0,
    pendingContractors: 0,
    projects: 0,
    bids: 0,
    acceptedBids: 0,
    conversations: 0,
    transactions: 0,
    totalCreditsInCirculation: 0,
    totalUnlocks: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let loadedSections = 0;
    const checkLoaded = () => {
      loadedSections++;
      if (loadedSections >= 5) setLoading(false);
    };

    // Real-time users
    const unsubUsers = onSnapshot(
      collection(db, "users"),
      (snapshot) => {
        let homeowners = 0;
        let contractors = 0;
        let admins = 0;
        let verified = 0;
        let pending = 0;
        let totalCredits = 0;

        snapshot.forEach((doc) => {
          const u = doc.data();
          if (u.role === "homeowner") homeowners++;
          else if (u.role === "contractor") {
            contractors++;
            if (u.verificationStatus === "approved") verified++;
            else if (u.verificationStatus === "pending") pending++;
            totalCredits += (u.creditBalance as number) || 0;
          } else if (u.role === "admin") admins++;
        });

        setStats((prev) => ({
          ...prev,
          homeowners,
          contractors,
          admins,
          totalUsers: homeowners + contractors + admins,
          verifiedContractors: verified,
          pendingContractors: pending,
          totalCreditsInCirculation: totalCredits,
        }));
        checkLoaded();
      },
      (error) => { console.error("Error fetching users:", error); checkLoaded(); }
    );

    // Real-time projects
    const unsubProjects = onSnapshot(
      collection(db, "projects"),
      (snapshot) => {
        setStats((prev) => ({ ...prev, projects: snapshot.size }));
        checkLoaded();
      },
      (error) => { console.error("Error fetching projects:", error); checkLoaded(); }
    );

    // Real-time bids
    const unsubBids = onSnapshot(
      collection(db, "bids"),
      (snapshot) => {
        let total = 0;
        let accepted = 0;
        snapshot.forEach((doc) => {
          total++;
          if (doc.data().status === "accepted") accepted++;
        });
        setStats((prev) => ({ ...prev, bids: total, acceptedBids: accepted }));
        checkLoaded();
      },
      (error) => { console.error("Error fetching bids:", error); checkLoaded(); }
    );

    // Real-time conversations
    const unsubConvs = onSnapshot(
      collection(db, "conversations"),
      (snapshot) => {
        setStats((prev) => ({ ...prev, conversations: snapshot.size }));
        checkLoaded();
      },
      (error) => { console.error("Error fetching conversations:", error); checkLoaded(); }
    );

    // Real-time unlocks
    const unsubUnlocks = onSnapshot(
      collection(db, "unlocks"),
      (snapshot) => {
        setStats((prev) => ({ ...prev, totalUnlocks: snapshot.size }));
        checkLoaded();
      },
      (error) => { console.error("Error fetching unlocks:", error); checkLoaded(); }
    );

    return () => {
      unsubUsers();
      unsubProjects();
      unsubBids();
      unsubConvs();
      unsubUnlocks();
    };
  }, []);

  const userCards = [
    { label: "Total Users", value: stats.totalUsers, icon: <HiUsers size={24} />, color: "bg-blue-500" },
    { label: "Homeowners", value: stats.homeowners, icon: <HiUsers size={24} />, color: "bg-green-500" },
    { label: "Contractors", value: stats.contractors, icon: <HiShieldCheck size={24} />, color: "bg-orange-500" },
    { label: "Admins", value: stats.admins, icon: <HiUsers size={24} />, color: "bg-purple-500" },
    { label: "Verified Contractors", value: stats.verifiedContractors, icon: <HiShieldCheck size={24} />, color: "bg-emerald-500" },
    { label: "Pending Verifications", value: stats.pendingContractors, icon: <HiShieldCheck size={24} />, color: "bg-amber-500" },
  ];

  const activityCards = [
    { label: "Total Projects", value: stats.projects, icon: <HiClipboardList size={24} />, color: "bg-purple-500" },
    { label: "Total Bids", value: stats.bids, icon: <HiCollection size={24} />, color: "bg-pink-500" },
    { label: "Accepted Bids", value: stats.acceptedBids, icon: <HiCollection size={24} />, color: "bg-green-500" },
    { label: "Conversations", value: stats.conversations, icon: <HiChat size={24} />, color: "bg-teal-500" },
    { label: "Project Unlocks", value: stats.totalUnlocks, icon: <HiLockOpen size={24} />, color: "bg-indigo-500" },
    { label: "Credits in Circulation", value: stats.totalCreditsInCirculation, icon: <HiCreditCard size={24} />, color: "bg-orange-500" },
  ];

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <DashboardLayout role="admin">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Platform Analytics</h1>
            <p className="text-gray-500 mt-1">Real-time overview of platform activity and metrics.</p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* User Metrics */}
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-4">User Metrics</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {userCards.map((card) => (
                    <div key={card.label} className="bg-white rounded-xl border border-gray-200 p-6 flex items-center gap-4">
                      <div className={`${card.color} text-white p-3 rounded-lg`}>{card.icon}</div>
                      <div>
                        <p className="text-sm text-gray-500">{card.label}</p>
                        <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Activity Metrics */}
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-4">Activity Metrics</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {activityCards.map((card) => (
                    <div key={card.label} className="bg-white rounded-xl border border-gray-200 p-6 flex items-center gap-4">
                      <div className={`${card.color} text-white p-3 rounded-lg`}>{card.icon}</div>
                      <div>
                        <p className="text-sm text-gray-500">{card.label}</p>
                        <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <HiChartBar size={24} className="text-orange-500" />
                  <h2 className="text-lg font-bold text-gray-900">Detailed Analytics</h2>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* User Role Pie Chart */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-4 text-center">User Distribution</h3>
                    {stats.totalUsers > 0 ? (() => {
                      const data = [
                        { name: "Homeowners", value: stats.homeowners, color: "#22c55e" },
                        { name: "Contractors", value: stats.contractors, color: "#f97316" },
                        { name: "Admins", value: stats.admins, color: "#8b5cf6" },
                      ].filter((d) => d.value > 0);
                      return (
                        <ResponsiveContainer width="100%" height={240}>
                          <PieChart>
                            <Pie data={data} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3} dataKey="value">
                              {data.map((entry, idx) => <Cell key={idx} fill={entry.color} />)}
                            </Pie>
                            <Tooltip formatter={(v) => [`${v} user${Number(v) !== 1 ? "s" : ""}`, ""]} />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      );
                    })() : (
                      <div className="flex items-center justify-center h-60 text-gray-400 text-sm">No user data yet</div>
                    )}
                  </div>

                  {/* Platform Activity Bar Chart */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-4 text-center">Platform Activity</h3>
                    <ResponsiveContainer width="100%" height={240}>
                      <BarChart
                        data={[
                          { name: "Projects", value: stats.projects, fill: "#8b5cf6" },
                          { name: "Bids", value: stats.bids, fill: "#f97316" },
                          { name: "Chats", value: stats.conversations, fill: "#14b8a6" },
                          { name: "Unlocks", value: stats.totalUnlocks, fill: "#6366f1" },
                        ]}
                        margin={{ top: 8, right: 16, left: 0, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                        <Tooltip formatter={(v) => [`${v}`, ""]} />
                        <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                          {[
                            { fill: "#8b5cf6" },
                            { fill: "#f97316" },
                            { fill: "#14b8a6" },
                            { fill: "#6366f1" },
                          ].map((e, idx) => (
                            <Cell key={idx} fill={e.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}


