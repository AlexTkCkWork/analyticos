import {z} from 'zod'

const emailField = z.string().email('Invalid email address').toLowerCase()
const passwordField = z.string().min(8, 'Password must be at least 8 characters')
const domainField = z.string().min(1, 'Domain is required').regex(
    /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/,
    "Must be a valid domain — e.g. mysite.com"
)

export const LoginSchema = z.object({
    email:    emailField,
    password: z.string().min(1, "Password is required"),
})

export const RegisterSchema = z.object({
    email:           emailField,
    password:        passwordField,
    confirmPassword: z.string(),
}).refine(
    (data) => data.password === data.confirmPassword,
    {
        message: "Passwords do not match",
        path:    ["confirmPassword"],
    }
)

export const CreateProjectSchema = z.object({
    name:   z.string().min(1, "Project name is required").max(50, "Max 50 characters"),
    domain: domainField,
})

export const UpdateProjectSchema = z.object({
    name: z.string().min(1, "Project name is required").max(50, "Max 50 characters"),
})

export const PageviewEventSchema = z.object({
    projectKey: z.string().min(1),
    url:        z.string().url("Invalid URL"),
    referrer:   z.string().optional().default(""),
    device:     z.enum(["desktop", "mobile", "tablet"]),
})

export const DashboardFiltersSchema = z.object({
    from:     z.coerce.date(),
    to:       z.coerce.date(),
    browser:  z.string().min(1).optional(),
    os:       z.string().min(1).optional(),
    device:   z.enum(["desktop", "mobile", "tablet"]).optional(),
    country:  z.string().length(2).optional(),
    referrer: z.string().min(1).optional(),
    url:      z.string().min(1).optional(),
}).refine(
    (data) => data.from <= data.to,
    {
        message: "Start date must be before end date",
        path:    ["from"],
    }
)

export type LoginInput          = z.infer<typeof LoginSchema>
export type RegisterInput       = z.infer<typeof RegisterSchema>
export type CreateProjectInput  = z.infer<typeof CreateProjectSchema>
export type UpdateProjectInput  = z.infer<typeof UpdateProjectSchema>
export type PageviewEvent       = z.infer<typeof PageviewEventSchema>
export type DashboardFilters    = z.infer<typeof DashboardFiltersSchema>
