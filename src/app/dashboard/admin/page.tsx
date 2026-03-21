"use client";

import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot, updateDoc, doc, deleteField } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ContractorUser } from "@/types";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Link from "next/link";
import Button from "@/components/ui/Button";
import toast from "react-hot-toast";
import { formatDate } from "@/lib/utils";
import { createNotification } from "@/lib/notifications";
import { HiUsers, HiShieldCheck, HiClipboardList, HiCreditCard, HiChat, HiCollection } from "react-icons/hi";

export default function AdminDashboard() {
  const [pendingContractors, setPendingContractors] = useState<ContractorUser[]>([]);
  const [allUsers, setAllUsers] = useState<{ homeowners: number; contractors: number; admins: number }>({
    homeowners: 0,
    contractors: 0,
    admins: 0,
  });
  const [platformStats, setPlatformStats] = useState({ projects: 0, bids: 0, conversations: 0, transactions: 0 });

  useEffect(() => {
    // Real-time listener for pending contractors
    const unsubUsers = onSnapshot(
      query(
        collection(db, "users"),
        where("role", "==", "contractor"),
        where("verificationStatus", "==", "pending")
      ),
      (snapshot) => {
        setPendingContractors(snapshot.docs.map((doc) => doc.data() as ContractorUser));
      },
      (error) => { console.error("Error loading pending contractors:", error); }
    );

    // Count all users by role
    const unsubAllUsers = onSnapshot(
      collection(db, "users"),
      (snapshot) => {
        let homeowners = 0;
        let contractors = 0;
        let admins = 0;

        snapshot.forEach((doc) => {
          const data = doc.data();
          switch (data.role) {
            case "homeowner":
              homeowners++;
              break;
            case "contractor":
              contractors++;
              break;
            case "admin":
              admins++;
              break;
          }
        });

        setAllUsers({ homeowners, contractors, admins });
      },
      (error) => { console.error("Error loading users:", error); }
    );

    // Real-time listener for projects
    const unsubProjects = onSnapshot(
      collection(db, "projects"),
      (snapshot) => {
        setPlatformStats((prev) => ({ ...prev, projects: snapshot.size }));
      },
      (error) => { console.error("Error loading projects:", error); }
    );

    // Real-time listener for bids
    const unsubBids = onSnapshot(
      collection(db, "bids"),
      (snapshot) => {
        setPlatformStats((prev) => ({ ...prev, bids: snapshot.size }));
      },
      (error) => { console.error("Error loading bids:", error); }
    );

    // Real-time listener for conversations
    const unsubConvs = onSnapshot(
      collection(db, "conversations"),
      (snapshot) => {
        setPlatformStats((prev) => ({ ...prev, conversations: snapshot.size }));
      },
      (error) => { console.error("Error loading conversations:", error); }
    );

    // Real-time listener for transactions
    const unsubTx = onSnapshot(
      collection(db, "transactions"),
      (snapshot) => {
        setPlatformStats((prev) => ({ ...prev, transactions: snapshot.size }));
      },
      (error) => { console.error("Error loading transactions:", error); }
    );

    return () => {
      unsubUsers();
      unsubAllUsers();
      unsubProjects();
      unsubBids();
      unsubConvs();
      unsubTx();
    };
  }, []);

  const handleVerification = async (uid: string, status: "approved" | "rejected") => {
    try {
      await updateDoc(doc(db, "users", uid), {
        verificationStatus: status,
        verifiedDate: status === "approved" ? new Date().toISOString() : deleteField(),
        updatedAt: new Date().toISOString(),
      });
      await createNotification({
        recipientUid: uid,
        type: status === "approved" ? "verification_approved" : "verification_rejected",
        title: status === "approved" ? "Account Verified!" : "Verification Rejected",
        message:
          status === "approved"
            ? "Your contractor account has been verified. You can now access the marketplace."
            : "Your contractor verification was not approved. Please contact support for assistance.",
        read: false,
        createdAt: new Date().toISOString(),
      });
      toast.success(`Contractor ${status === "approved" ? "approved" : "rejected"} successfully.`);
    } catch {
      toast.error("Failed to update verification status.");
    }
  };

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <DashboardLayout role="admin">
        <div className="space-y-8">
          {/* Welcome */}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-500 mt-1">Manage contractors, users, and platform analytics.</p>
          </div>

          {/* User Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: "Total Users", value: (allUsers.homeowners + allUsers.contractors + allUsers.admins).toString(), icon: <HiUsers size={24} />, color: "bg-green-500", href: "/dashboard/admin/users" },
              { label: "Homeowners", value: allUsers.homeowners.toString(), icon: <HiUsers size={24} />, color: "bg-orange-500", href: "/dashboard/admin/users" },
              { label: "Contractors", value: allUsers.contractors.toString(), icon: <HiShieldCheck size={24} />, color: "bg-blue-500", href: "/dashboard/admin/verifications" },
              { label: "Pending Verifications", value: pendingContractors.length.toString(), icon: <HiClipboardList size={24} />, color: "bg-amber-500", href: "/dashboard/admin/verifications" },
            ].map((stat) => (
              <Link key={stat.label} href={stat.href} className="bg-white rounded-xl border border-gray-200 p-6 hover:border-orange-200 hover:shadow-sm transition-all">
                <div className={`${stat.color} text-white p-3 rounded-lg w-fit mb-4`}>
                  {stat.icon}
                </div>
                <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
              </Link>
            ))}
          </div>

          {/* Platform Activity Stats */}
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-4">Platform Activity</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: "Total Projects", value: platformStats.projects.toString(), icon: <HiClipboardList size={24} />, color: "bg-purple-500" },
                { label: "Total Bids", value: platformStats.bids.toString(), icon: <HiCollection size={24} />, color: "bg-pink-500" },
                { label: "Conversations", value: platformStats.conversations.toString(), icon: <HiChat size={24} />, color: "bg-teal-500" },
                { label: "Transactions", value: platformStats.transactions.toString(), icon: <HiCreditCard size={24} />, color: "bg-indigo-500" },
              ].map((stat) => (
                <Link key={stat.label} href="/dashboard/admin/analytics" className="bg-white rounded-xl border border-gray-200 p-6 hover:border-orange-200 hover:shadow-sm transition-all">
                  <div className={`${stat.color} text-white p-3 rounded-lg w-fit mb-4`}>
                    {stat.icon}
                  </div>
                  <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
                </Link>
              ))}
            </div>
          </div>

          {/* Pending Verifications */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              Pending Contractor Verifications ({pendingContractors.length})
            </h2>

            {pendingContractors.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <HiShieldCheck size={48} className="mx-auto mb-4 opacity-50" />
                <p className="font-medium">No pending verifications</p>
                <p className="text-sm mt-1">All contractors have been reviewed.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingContractors.map((contractor) => (
                  <div
                    key={contractor.uid}
                    className="border border-gray-200 rounded-lg p-6"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="space-y-2">
                        <h3 className="font-semibold text-gray-900 text-lg">
                          {contractor.companyName}
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1 text-sm">
                          <p className="text-gray-500">
                            <span className="font-medium text-gray-700">Contact:</span>{" "}
                            {contractor.contactName}
                          </p>
                          <p className="text-gray-500">
                            <span className="font-medium text-gray-700">Email:</span>{" "}
                            {contractor.email}
                          </p>
                          <p className="text-gray-500">
                            <span className="font-medium text-gray-700">Phone:</span>{" "}
                            {contractor.phone}
                          </p>
                          <p className="text-gray-500">
                            <span className="font-medium text-gray-700">Registered:</span>{" "}
                            {formatDate(contractor.createdAt)}
                          </p>
                          <p className="text-gray-500">
                            <span className="font-medium text-gray-700">BN:</span>{" "}
                            {contractor.businessNumber}
                          </p>
                          <p className="text-gray-500">
                            <span className="font-medium text-gray-700">OBR:</span>{" "}
                            {contractor.obrNumber}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-3 shrink-0">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleVerification(contractor.uid, "approved")}
                        >
                          Approve
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleVerification(contractor.uid, "rejected")}
                        >
                          Reject
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

