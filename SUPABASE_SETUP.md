# Supabase Setup Guide for CloudShare

This guide will help you set up Supabase for the CloudShare file-sharing application.

## 1. Create a Supabase Project

1. Go to [Supabase](https://app.supabase.com)
2. Click "New Project"
3. Fill in the project details:
   - Name: CloudShare
   - Database Password: Create a strong password
   - Region: Choose the closest to you
4. Wait for the project to be created (takes 2-3 minutes)

## 2. Get Your Credentials

1. Go to **Settings** → **API** in your Supabase project
2. Copy these values to your `.env.local`:
   - **VITE_SUPABASE_URL**: Found under "URL"
   - **VITE_SUPABASE_ANON_KEY**: Found under "anon public"

## 3. Create Storage Bucket

1. Go to **Storage** in your Supabase project
2. Click "New Bucket"
3. Name it: `files`
4. Uncheck "Private bucket" to make files publicly accessible
5. Click "Create bucket"

## 4. Create the 'files' Table

Run this SQL in the Supabase SQL Editor (**SQL Editor** → **New Query**):

```sql
CREATE TABLE files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  file_type TEXT NOT NULL,
  storage_path TEXT NOT NULL UNIQUE,
  public_url TEXT NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE files ENABLE ROW LEVEL SECURITY;

-- Create RLS policy to allow users to see only their files
CREATE POLICY "Users can view their own files" ON files
  FOR SELECT USING (auth.uid()::text = user_id);

-- Create policy to allow users to insert their own files
CREATE POLICY "Users can insert their own files" ON files
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- Create policy to allow users to delete their own files
CREATE POLICY "Users can delete their own files" ON files
  FOR DELETE USING (auth.uid()::text = user_id);

-- Create index for faster queries
CREATE INDEX idx_files_user_id ON files(user_id);
CREATE INDEX idx_files_uploaded_at ON files(uploaded_at DESC);
```

## 5. Set Storage Bucket Policies

In Supabase, go to **Storage** → **files bucket** → **Policies**:

1. Click "New policy"
2. Choose "For SELECT (SELECT)"
3. Name: "Public access to files"
4. Under "Target roles", select "Public"
5. Under "Policy expression", use:
   ```
   true
   ```
6. Click "Review" and "Save"

For DELETE operations:
1. Click "New policy"
2. Choose "For DELETE (DELETE)"
3. Name: "Users can delete their own files"
4. Under "Policy expression", use:
   ```
   auth.uid()::text = owner
   ```

## 6. Update .env.local

Copy `.env.local.template` to `.env.local` and fill in:

```env
# Firebase Configuration (for Authentication)
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

## 7. Start Your App

```bash
npm run dev
```

Visit `http://localhost:5173/` and start uploading files!

## Features Included

✅ **File Upload** with progress tracking  
✅ **Public File URLs** for sharing  
✅ **File Metadata Storage** in Supabase database  
✅ **Download Files** from the list  
✅ **Delete Files** from storage and database  
✅ **User Authentication** with Firebase  
✅ **Row Level Security** - users can only see their own files  

## Troubleshooting

### "Failed to upload file" error
- Check that your `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are correct
- Ensure the "files" bucket exists and is public
- Check browser console for detailed error messages

### Files not appearing in the list
- Make sure the `files` table was created successfully
- Check that RLS policies are set up correctly
- Verify you're logged in with a valid Firebase account

### Can't download files
- Ensure the "files" bucket has public access enabled
- Check that `public_url` is being saved correctly in the database

## Next Steps

- Add file sharing features (generate shareable links)
- Implement file encryption
- Add batch file upload
- Create file categories/folders
- Add search functionality
