import { describe, it, expect } from 'vitest';
import { GET, POST } from '../src/app/api/kudos/route';
import { PATCH, DELETE } from '../src/app/api/kudos/[id]/route';

describe('Kudos API Core CRUD Functionality', () => {
  let createdKudosId: string;

  it('1. Create — Should insert a new kudos', async () => {
    // Construct mock request for POST
    const req = new Request('http://localhost:3000/api/kudos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sender: 'Test User',
        receiver: 'Alex',
        message: 'This is a test kudos',
        category: '🔥',
        isAnonymous: false,
      })
    });

    const res = await POST(req);
    expect(res.status).toBe(201);
    
    const data = await res.json();
    expect(data).toHaveProperty('_id');
    expect(data.sender).toBe('Test User');
    expect(data.message).toBe('This is a test kudos');

    createdKudosId = data._id; // save for next tests
  });

  it('2. Read — Should fetch the created kudos', async () => {
    const req = new Request('http://localhost:3000/api/kudos', { method: 'GET' });
    const res = await GET(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
    
    const created = data.find((k: any) => k._id === createdKudosId);
    expect(created).toBeDefined();
    expect(created.message).toBe('This is a test kudos');
  });

  it('3. Update — Should edit a field and persist the change', async () => {
    const req = new Request(`http://localhost:3000/api/kudos/${createdKudosId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'This is an updated test kudos' })
    });

    const context = { params: Promise.resolve({ id: createdKudosId }) };
    const res = await PATCH(req, context);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.message).toBe('This is an updated test kudos');
  });

  it('4. Delete — Should remove the kudos', async () => {
    // Delete it
    const delReq = new Request(`http://localhost:3000/api/kudos/${createdKudosId}`, { method: 'DELETE' });
    const context = { params: Promise.resolve({ id: createdKudosId }) };
    const delRes = await DELETE(delReq, context);
    expect(delRes.status).toBe(200);

    // Verify it's gone
    const getReq = new Request('http://localhost:3000/api/kudos', { method: 'GET' });
    const getRes = await GET(getReq);
    const data = await getRes.json();
    
    const created = data.find((k: any) => k._id === createdKudosId);
    expect(created).toBeUndefined();
  });
});
