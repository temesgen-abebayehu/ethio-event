"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/endpoints";
import { ApiError } from "@/lib/api";
import { useToast } from "@/lib/toast";
import { useRequireAuth } from "@/lib/useRequireAuth";
import { LoadingSpinner } from "@/components/LoadingSpinner";

export default function AdminCategoriesPage() {
    const { ready } = useRequireAuth({ admin: true });
    const toast = useToast();
    const qc = useQueryClient();
    const [name, setName] = useState("");

    const { data, isLoading } = useQuery({
        queryKey: ["admin-categories"],
        queryFn: api.adminCategories,
        enabled: ready,
    });

    const invalidate = () => qc.invalidateQueries({ queryKey: ["admin-categories"] });

    const create = useMutation({
        mutationFn: () => api.createCategory({ name }),
        onSuccess: () => {
            setName("");
            toast.success("Category created");
            invalidate();
        },
        onError: (err) => toast.error(err instanceof ApiError ? err.message : "Failed to create"),
    });

    const toggle = useMutation({
        mutationFn: ({ id, active }: { id: string; active: boolean }) => api.setCategoryActive(id, active),
        onSuccess: invalidate,
    });

    const remove = useMutation({
        mutationFn: (id: string) => api.deleteCategory(id),
        onSuccess: () => {
            toast.success("Category deleted");
            invalidate();
        },
        onError: (err) =>
            toast.error(err instanceof ApiError ? err.message : "Cannot delete category"),
    });

    if (!ready || isLoading) return <LoadingSpinner className="py-24" />;

    const categories = data ?? [];

    return (
        <div className="container mx-auto max-w-3xl px-4 py-8">
            <h1 className="mb-6 text-3xl font-bold">Category Management</h1>

            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    create.mutate();
                }}
                className="mb-6 flex gap-2"
            >
                <input
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="New category name"
                    className="flex-1 rounded-lg border border-gray-300 px-4 py-2"
                />
                <button
                    type="submit"
                    disabled={create.isPending}
                    className="rounded-lg bg-primary px-5 py-2 font-semibold text-white hover:bg-primary-dark disabled:opacity-50"
                >
                    Add
                </button>
            </form>

            <div className="divide-y divide-gray-100 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                {categories.map((c) => (
                    <div key={c.id} className="flex items-center justify-between px-4 py-3">
                        <div>
                            <span className="font-medium">{c.name}</span>
                            <span className="ml-2 text-sm text-gray-500">({c.event_count} events)</span>
                            {!c.is_active && (
                                <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">Inactive</span>
                            )}
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                            <button
                                onClick={() => toggle.mutate({ id: c.id, active: !c.is_active })}
                                className="font-medium text-gray-600 hover:underline"
                            >
                                {c.is_active ? "Deactivate" : "Activate"}
                            </button>
                            <button
                                onClick={() => confirm(`Delete "${c.name}"?`) && remove.mutate(c.id)}
                                className="font-medium text-red-600 hover:underline"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
