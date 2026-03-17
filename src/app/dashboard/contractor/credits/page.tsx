"use client";

import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot, doc, runTransaction, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import Button from "@/components/ui/Button";
import toast from "react-hot-toast";
import { ContractorUser, CreditPackage, CreditTransaction } from "@/types";
import { formatDate } from "@/lib/utils";
import {
  HiCreditCard,
  HiStar,
  HiShoppingCart,
  HiClock,
  HiArrowUp,
  HiArrowDown,
  HiRefresh,
} from "react-icons/hi";

const DEFAULT_PACKAGES: CreditPackage[] = [
  { id: "starter", name: "Starter Pack", credits: 5, price: 29.99, pricePerCredit: 6.0 },
  { id: "standard", name: "Standard Pack", credits: 15, price: 79.99, pricePerCredit: 5.33 },
  { id: "pro", name: "Pro Pack", credits: 30, price: 149.99, pricePerCredit: 5.0 },
  { id: "enterprise", name: "Enterprise Pack", credits: 60, price: 279.99, pricePerCredit: 4.67 },
];

export default function ContractorCreditsPage() {
  const { userProfile, refreshProfile } = useAuth();
  const contractor = userProfile as ContractorUser | null;
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [transactionsLoading, setTransactionsLoading] = useState(true);
  const [creditPackages, setCreditPackages] = useState<CreditPackage[]>(DEFAULT_PACKAGES);

  const creditBalance = contractor?.creditBalance ?? 0;

  // Load credit packages from admin settings
  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const snap = await getDoc(doc(db, "settings", "creditPackages"));
        if (snap.exists()) {
          const data = snap.data();
          const pkgs = (data.packages as Array<{ id: string; label: string; credits: number; price: number }>)
            .map((p) => ({
              id: p.id,
              name: p.label,
              credits: p.credits,
              price: p.price,
              pricePerCredit: p.credits > 0 ? p.price / p.credits : 0,
            }));
          if (pkgs.length > 0) setCreditPackages(pkgs);
        }
      } catch {
        // Fall back to defaults silently
      }
    };
    fetchPackages();
  }, []);

  // Fetch transaction history
  useEffect(() => {
    if (!userProfile) return;

    const q = query(
      collection(db, "transactions"),
      where("contractorUid", "==", userProfile.uid)
    );
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const userTransactions = snapshot.docs
          .map((d) => ({ id: d.id, ...d.data() } as CreditTransaction))
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setTransactions(userTransactions);
        setTransactionsLoading(false);
      },
      (error) => { console.error("Error loading transactions:", error); setTransactionsLoading(false); }
    );

    return () => unsubscribe();
  }, [userProfile]);

  const [buyingId, setBuyingId] = useState<string | null>(null);

  const handleBuyCredits = async (pkg: CreditPackage) => {
    if (!contractor) return;
    setBuyingId(pkg.id);
    try {
      const userRef = doc(db, "users", contractor.uid);
      const txRef = doc(collection(db, "transactions"));
      const now = new Date().toISOString();

      await runTransaction(db, async (transaction) => {
        const userSnap = await transaction.get(userRef);
        const currentBalance = (userSnap.data()?.creditBalance as number) ?? 0;
        transaction.update(userRef, { creditBalance: currentBalance + pkg.credits });
        transaction.set(txRef, {
          contractorUid: contractor.uid,
          creditAmount: pkg.credits,
          cost: pkg.price,
          type: "purchase",
          timestamp: now,
        });
      });

      await refreshProfile();
      toast.success(`${pkg.credits} credits added! (Simulated — Stripe in Iteration 2)`);
    } catch {
      toast.error("Failed to purchase credits.");
    } finally {
      setBuyingId(null);
    }
  };

  const getTransactionIcon = (type: CreditTransaction["type"]) => {
    switch (type) {
      case "purchase":
        return <HiArrowUp size={16} className="text-green-500" />;
      case "unlock":
        return <HiArrowDown size={16} className="text-orange-500" />;
      case "refund":
        return <HiRefresh size={16} className="text-blue-500" />;
    }
  };

  const getTransactionLabel = (type: CreditTransaction["type"]) => {
    switch (type) {
      case "purchase":
        return "Credit Purchase";
      case "unlock":
        return "Project Unlock";
      case "refund":
        return "Credit Refund";
    }
  };

  return (
    <ProtectedRoute allowedRoles={["contractor"]}>
      <DashboardLayout role="contractor">
        <div className="space-y-8">
          {/* Page Header */}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Buy Credits</h1>
            <p className="text-gray-500 mt-1">
              Purchase credits to unlock homeowner renovation projects.
            </p>
          </div>

          {/* Current Balance */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 flex items-center gap-4">
            <div className="bg-orange-500 text-white p-4 rounded-lg">
              <HiCreditCard size={32} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Current Credit Balance</p>
              <p className="text-4xl font-bold text-gray-900">{creditBalance}</p>
              <p className="text-xs text-gray-400 mt-1">
                Credits are used to unlock project details and contact information.
              </p>
            </div>
          </div>

          {/* Credit Packages */}
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              Choose a Credit Package
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {creditPackages.map((pkg, idx) => {
                const isPopular = idx === 1;
                return (
                  <div
                    key={pkg.id}
                    className={`bg-white rounded-xl border-2 p-6 flex flex-col relative transition-all duration-200 hover:shadow-md ${
                      isPopular
                        ? "border-orange-500 shadow-sm"
                        : "border-gray-200 hover:border-orange-200"
                    }`}
                  >
                    {/* Popular Badge */}
                    {isPopular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <span className="bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                          <HiStar size={12} />
                          POPULAR
                        </span>
                      </div>
                    )}

                    <div className="text-center flex-1">
                      <h3 className="text-lg font-bold text-gray-900 mt-2">
                        {pkg.name}
                      </h3>
                      <div className="mt-4">
                        <span className="text-4xl font-bold text-gray-900">
                          ${pkg.price}
                        </span>
                      </div>
                      <div className="mt-2 space-y-1">
                        <p className="text-orange-600 font-semibold text-lg">
                          {pkg.credits} Credits
                        </p>
                        <p className="text-sm text-gray-500">
                          ${pkg.pricePerCredit.toFixed(2)}/credit
                        </p>
                      </div>
                    </div>

                    <div className="mt-6">
                      <Button
                        fullWidth
                        variant={isPopular ? "primary" : "outline"}
                        onClick={() => handleBuyCredits(pkg)}
                        loading={buyingId === pkg.id}
                      >
                        <HiShoppingCart size={16} className="mr-1.5" />
                        Buy Now
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Transaction History */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              Transaction History
            </h2>

            {transactionsLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <HiClock size={48} className="mx-auto mb-4 opacity-50" />
                <p className="font-medium">No transactions yet</p>
                <p className="text-sm mt-1">
                  Your credit purchase and usage history will appear here.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-500">
                        Type
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">
                        Credits
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">
                        Amount
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((tx) => (
                      <tr
                        key={tx.id}
                        className="border-b border-gray-100 hover:bg-gray-50"
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            {getTransactionIcon(tx.type)}
                            <span className="text-gray-900">
                              {getTransactionLabel(tx.type)}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`font-medium ${
                              tx.type === "purchase" || tx.type === "refund"
                                ? "text-green-600"
                                : "text-orange-600"
                            }`}
                          >
                            {tx.type === "purchase" || tx.type === "refund"
                              ? "+"
                              : "-"}
                            {tx.creditAmount}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          {tx.cost > 0 ? `$${tx.cost.toFixed(2)}` : "--"}
                        </td>
                        <td className="py-3 px-4 text-gray-500">
                          {formatDate(tx.timestamp)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

