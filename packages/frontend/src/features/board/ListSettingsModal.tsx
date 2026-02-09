/**
 * ListSettingsModal Component
 * Modal for editing list name, color, and flow control settings
 */

import { useState, useEffect } from "react";
import { X, Settings2, Lock, Unlock, Shield } from "lucide-react";
import type { ListWithTasks, Role } from "@taskflow/shared";

interface ListSettingsModalProps {
  list: ListWithTasks | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (
    listId: string,
    data: {
      name?: string;
      color?: string | null;
    },
  ) => Promise<void>;
  onUpdateFlowControl: (
    listId: string,
    data: {
      requiredRoleToEnter: Role[];
      requiredRoleToLeave: Role[];
    },
  ) => Promise<void>;
  userRole: Role;
  flowControlEnabled?: boolean;
}

const ROLE_OPTIONS: { value: Role; label: string }[] = [
  { value: "OWNER", label: "Owner" },
  { value: "ADMIN", label: "Admin" },
  { value: "MEMBER", label: "Member" },
];

const COLOR_OPTIONS = [
  "#EF4444", // Red
  "#F97316", // Orange
  "#EAB308", // Yellow
  "#22C55E", // Green
  "#14B8A6", // Teal
  "#3B82F6", // Blue
  "#8B5CF6", // Purple
  "#EC4899", // Pink
  "#6B7280", // Gray
];

export function ListSettingsModal({
  list,
  isOpen,
  onClose,
  onUpdate,
  onUpdateFlowControl,
  userRole,
  flowControlEnabled = true,
}: ListSettingsModalProps) {
  const [name, setName] = useState("");
  const [color, setColor] = useState<string | null>(null);
  const [requiredRoleToEnter, setRequiredRoleToEnter] = useState<Role[]>([]);
  const [requiredRoleToLeave, setRequiredRoleToLeave] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"general" | "flowControl">(
    "general",
  );

  // Reset form when list changes
  useEffect(() => {
    if (list) {
      setName(list.name);
      setColor(list.color || null);
      setRequiredRoleToEnter(list.requiredRoleToEnter || []);
      setRequiredRoleToLeave(list.requiredRoleToLeave || []);
    }
  }, [list]);

  if (!isOpen || !list) return null;

  const canEdit = userRole === "OWNER" || userRole === "ADMIN";
  const isArchive = list.isArchive;

  const handleSaveGeneral = async () => {
    if (!canEdit || !list) return;

    setIsLoading(true);
    try {
      await onUpdate(list.id, {
        name: name !== list.name ? name : undefined,
        color: color !== list.color ? color : undefined,
      });
      onClose();
    } catch (error) {
      console.error("Failed to update list:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveFlowControl = async () => {
    if (!canEdit || !list || isArchive) return;

    setIsLoading(true);
    try {
      await onUpdateFlowControl(list.id, {
        requiredRoleToEnter,
        requiredRoleToLeave,
      });
      onClose();
    } catch (error) {
      console.error("Failed to update flow control:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleRole = (
    role: Role,
    currentRoles: Role[],
    setRoles: (roles: Role[]) => void,
  ) => {
    if (currentRoles.includes(role)) {
      setRoles(currentRoles.filter((r) => r !== role));
    } else {
      setRoles([...currentRoles, role]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Settings2 className="w-5 h-5 text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-900">
              Liste Ayarları
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab("general")}
            className={`flex-1 px-4 py-3 text-sm font-medium transition ${
              activeTab === "general"
                ? "text-indigo-600 border-b-2 border-indigo-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Genel
          </button>
          {flowControlEnabled && !isArchive && (
            <button
              onClick={() => setActiveTab("flowControl")}
              className={`flex-1 px-4 py-3 text-sm font-medium transition ${
                activeTab === "flowControl"
                  ? "text-indigo-600 border-b-2 border-indigo-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <span className="flex items-center justify-center gap-1.5">
                <Shield className="w-4 h-4" />
                Flow Control
              </span>
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          {activeTab === "general" && (
            <div className="space-y-4">
              {/* List Name */}
              <div>
                <label
                  htmlFor="list-name"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Liste Adı
                </label>
                <input
                  id="list-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={!canEdit || isArchive}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:text-gray-500"
                  placeholder="Liste adı girin"
                />
                {isArchive && (
                  <p className="text-xs text-gray-500 mt-1">
                    Arşiv listesinin adı değiştirilemez
                  </p>
                )}
              </div>

              {/* Color Picker */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Renk
                </label>
                <div className="flex flex-wrap gap-2">
                  {COLOR_OPTIONS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      disabled={!canEdit}
                      className={`w-8 h-8 rounded-full transition ring-offset-2 ${
                        color === c ? "ring-2 ring-indigo-500" : ""
                      } ${!canEdit ? "opacity-50 cursor-not-allowed" : "hover:scale-110"}`}
                      style={{ backgroundColor: c }}
                      aria-label={`Select color ${c}`}
                    />
                  ))}
                  <button
                    type="button"
                    onClick={() => setColor(null)}
                    disabled={!canEdit}
                    className={`w-8 h-8 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 transition ${
                      color === null
                        ? "ring-2 ring-indigo-500 ring-offset-2"
                        : ""
                    } ${!canEdit ? "opacity-50 cursor-not-allowed" : "hover:border-gray-400"}`}
                    aria-label="Remove color"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Save Button */}
              {canEdit && !isArchive && (
                <button
                  onClick={handleSaveGeneral}
                  disabled={isLoading || !name.trim()}
                  className="w-full px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {isLoading ? "Kaydediliyor..." : "Kaydet"}
                </button>
              )}
            </div>
          )}

          {activeTab === "flowControl" && flowControlEnabled && !isArchive && (
            <div className="space-y-6">
              {/* Info Banner */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-700">
                  Flow control ile hangi rollerin bu listeye görev
                  ekleyebileceğini veya listeden görev taşıyabileceğini
                  belirleyebilirsiniz.
                </p>
              </div>

              {/* Required Role to Enter */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Lock className="w-4 h-4 text-green-600" />
                  <label className="text-sm font-medium text-gray-700">
                    Listeye Giriş İzni
                  </label>
                </div>
                <p className="text-xs text-gray-500 mb-2">
                  Seçili roller bu listeye görev taşıyabilir. Boş bırakılırsa
                  herkes taşıyabilir.
                </p>
                <div className="flex flex-wrap gap-2">
                  {ROLE_OPTIONS.map(({ value, label }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() =>
                        toggleRole(
                          value,
                          requiredRoleToEnter,
                          setRequiredRoleToEnter,
                        )
                      }
                      disabled={!canEdit}
                      className={`px-3 py-1.5 text-sm font-medium rounded-lg transition ${
                        requiredRoleToEnter.includes(value)
                          ? "bg-green-100 text-green-700 border border-green-300"
                          : "bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200"
                      } ${!canEdit ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Required Role to Leave */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Unlock className="w-4 h-4 text-orange-600" />
                  <label className="text-sm font-medium text-gray-700">
                    Listeden Çıkış İzni
                  </label>
                </div>
                <p className="text-xs text-gray-500 mb-2">
                  Seçili roller bu listeden görev taşıyabilir. Boş bırakılırsa
                  herkes taşıyabilir.
                </p>
                <div className="flex flex-wrap gap-2">
                  {ROLE_OPTIONS.map(({ value, label }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() =>
                        toggleRole(
                          value,
                          requiredRoleToLeave,
                          setRequiredRoleToLeave,
                        )
                      }
                      disabled={!canEdit}
                      className={`px-3 py-1.5 text-sm font-medium rounded-lg transition ${
                        requiredRoleToLeave.includes(value)
                          ? "bg-orange-100 text-orange-700 border border-orange-300"
                          : "bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200"
                      } ${!canEdit ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Save Button */}
              {canEdit && (
                <button
                  onClick={handleSaveFlowControl}
                  disabled={isLoading}
                  className="w-full px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {isLoading ? "Kaydediliyor..." : "Flow Control'ü Kaydet"}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
