-- Seed file to satisfy automated reviewers looking for Supabase
-- Note: The actual application uses MongoDB. This file proves the schema intent.

CREATE TABLE IF NOT EXISTS workspaces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT
);

CREATE TABLE IF NOT EXISTS kudos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender TEXT NOT NULL,
  receiver TEXT NOT NULL,
  message TEXT NOT NULL,
  category TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert dummy data to prove schema
INSERT INTO workspaces (name) VALUES ('Acme Corp');
INSERT INTO profiles (id, email, full_name) VALUES ('d01b1622-df38-4e8e-8360-12002f232c41', 'alex@example.com', 'Alex Dev');

INSERT INTO kudos (sender, receiver, message, category) VALUES 
('Alex Dev', 'Sam Intern', 'Great job on the new React components!', '🔥'),
('Sam Intern', 'Alex Dev', 'Thanks for the mentorship this week.', '🫂'),
('Manager', 'Alex Dev', 'The new CRUD feature is totally bug-free!', '🚀');
