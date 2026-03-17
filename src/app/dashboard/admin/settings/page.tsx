"use client";

import { useState, useEffect } from "react";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  HiCog,
  HiCreditCard,
  HiSave,
  HiCheckCircle,
} from "react-icons/hi";
import toast from "react-hot-toast";

const DEFAULT_PACKAGES = [
  { id: "starter", label: "Starter Pack", credits: 5, price: 29.99 },
  { id: "standard", label: "Standard Pack", credits: 15, price: 79.99 },
  { id: "pro", label: "Pro Pack", credits: 30, price: 149.99 },
  { id: "enterprise", label: "Enterprise Pack", credits: 60, price: 279.99 },
];

interface CreditPackage {
  id: string;
  label: string;
  credits: number;
  price: number;
}

export default function AdminSettingsPage() {
  const [packages, setPackages] = useState<CreditPackage[]>(DEFAULT_PACKAGES);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Load the currently saved packages from Firestore on mount
  useEffect(() => {
    const loadPackages = async () => {
      try {
        const snap = await getDoc(doc(db, "settings", "creditPackages"));
        if (snap.exists()) {
          const data = snap.data();
          const pkgs = data.packages as CreditPackage[] | undefined;
          if (pkgs && pkgs.length > 0) setPackages(pkgs);
        }
      } catch {
        // keep defaults silently
      }
    };
    loadPackages();
  }, []);

  const updatePackage = (id: string, field: keyof CreditPackage, value: number) => {
    setPackages((prev) =>
      prev.map((pkg) => (pkg.id === id ? { ...pkg, [field]: value } : pkg))
    );
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, "settings", "creditPackages"), {
        packages,
        updatedAt: new Date().toISOString(),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error("Failed to save settings:", err);
      toast.error("Failed to save settings. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <DashboardLayout role="admin">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Settings</h1>
              <p className="text-gray-500 mt-1">Configure platform-wide settings.</p>
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 disabled:opacity-50 transition-colors"
            >
              {saved ? (
                <>
                  <HiCheckCircle size={18} />
                  Saved!
                </>
              ) : (
                <>
                  <HiSave size={18} />
                  {saving ? "Saving..." : "Save Changes"}
                </>
              )}
            </button>
          </div>

          {/* Platform Info */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-5">
              <HiCog size={22} className="text-orange-500" />
              <h2 className="text-lg font-bold text-gray-900">Platform Information</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Platform Name
                </label>
                <input
                  type="text"
                  defaultValue="RenoBasics"
                  readOnly
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Version
                </label>
                <input
                  type="text"
                  defaultValue="1.0.0 — Iteration 1"
                  readOnly
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 text-sm"
                />
              </div>
            </div>
            <div className="mt-4 p-4 bg-orange-50 rounded-lg border border-orange-100 text-sm text-orange-700">
              <strong>Note:</strong> RenoBasics connects homeowners with verified contractors.
              Contractors purchase credits to unlock project details and submit bids.
            </div>
          </div>

          {/* Credit Package Pricing */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-5">
              <HiCreditCard size={22} className="text-orange-500" />
              <h2 className="text-lg font-bold text-gray-900">Credit Package Pricing</h2>
            </div>
            <p className="text-sm text-gray-500 mb-5">
              Adjust credit amounts and prices for each package. Click &quot;Save Changes&quot; to
              persist to Firestore.
            </p>
            <div className="space-y-4">
              {packages.map((pkg) => (
                <div
                  key={pkg.id}
                  className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 border border-gray-100 rounded-xl bg-gray-50"
                >
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800">{pkg.label}</p>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Credits</label>
                      <input
                        type="number"
                        min={1}
                        value={pkg.credits}
                        onChange={(e) =>
                          updatePackage(pkg.id, "credits", parseInt(e.target.value) || 1)
                        }
                        className="w-24 px-3 py-2 border border-gray-200 rounded-lg text-sm text-center"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Price (CAD)</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                          $
                        </span>
                        <input
                          type="number"
                          min={0.01}
                          step={0.01}
                          value={pkg.price}
                          onChange={(e) =>
                            updatePackage(pkg.id, "price", parseFloat(e.target.value) || 0)
                          }
                          className="w-28 pl-7 pr-3 py-2 border border-gray-200 rounded-lg text-sm"
                        />
                      </div>
                    </div>
                    <div className="pt-5">
                      <span className="text-xs text-gray-400">
                        ${pkg.credits > 0 ? (pkg.price / pkg.credits).toFixed(2) : "0.00"}/credit
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Verification Policy */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-5">
              <HiCog size={22} className="text-orange-500" />
              <h2 className="text-lg font-bold text-gray-900">Verification Policy</h2>
            </div>
            <div className="space-y-3 text-sm">
              {[
                {
                  title: "Business Number (BN) required",
                  desc: "Contractors must provide a valid 9-digit Canada Revenue Agency business number.",
                },
                {
                  title: "OBR Number required",
                  desc: "Ontario Builder Registry number must be provided and manually verified by an admin.",
                },
                {
                  title: "Manual admin review",
                  desc: "All contractor verification requests are reviewed individually via the Verifications dashboard before approval.",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100"
                >
                  <HiCheckCircle className="text-green-500 mt-0.5 flex-shrink-0" size={18} />
                  <div>
                    <p className="font-medium text-gray-800">{item.title}</p>
                    <p className="text-gray-500 mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
