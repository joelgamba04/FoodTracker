// src/models/profilemodels.ts
export type ApiUserProfile = {
  first_name: string;
  middle_name?: string | null;
  last_name: string;
  email: string;
  gender_id: number; 
  age: number;
  height: string; 
  weight: string; 
};

export type ApiUserProfileResponse = {
  success: boolean;
  data: ApiUserProfile;
};

export type AppProfile = {
  firstName: string;
  middleName: string;
  lastName: string;
  email: string;
  genderId: "1" | "2";
  age: string;
  heightCm: string;
  weightKg: string;
  activityLevel?: "sedentary" | "light" | "moderate" | "active";
};

export function apiToAppProfile(api: ApiUserProfile): AppProfile {
  return {
    firstName: api.first_name ?? "",
    middleName: api.middle_name ?? "",
    lastName: api.last_name ?? "",
    email: api.email ?? "",
    genderId: String(api.gender_id) as "1" | "2",
    age: String(api.age ?? ""),
    heightCm: String(api.height ?? ""), // already "150.00"
    weightKg: String(api.weight ?? ""),
  };
}

export function appToUpdatePayload(profile: AppProfile) {
  return {
    gender_id: profile.genderId,
    age: profile.age,
    height_cm: profile.heightCm,
    weight_kg: profile.weightKg,
    activity_level: profile.activityLevel ?? "active",
  };
}
