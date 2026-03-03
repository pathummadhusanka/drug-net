# Areas Feature Implementation

## Overview

The areas database table is now fully implemented and ready to use. Areas represent geographic locations and can be associated with profiles.

## Database Structure

### Table: `areas`

```sql
CREATE TABLE areas (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL UNIQUE
);
```

**Features:**

- Auto-incremented `id` for each area
- Unique constraint on `name` to prevent duplicates
- Case-sensitive name matching

## Backend API (Rust Commands)

### Available Commands

1. **create_area** - Create a new area or get existing one
    - Params: `{ area: { name: string } }`
    - Returns: `number` (area ID)
    - Note: If area already exists, returns existing ID

2. **get_area** - Get area by ID
    - Params: `{ id: number }`
    - Returns: `Area | null`

3. **get_area_by_name** - Get area by name
    - Params: `{ name: string }`
    - Returns: `Area | null`

4. **get_all_areas** - Get all areas
    - Params: none
    - Returns: `Area[]` (sorted alphabetically)

5. **delete_area** - Delete an area
    - Params: `{ id: number }`
    - Returns: `void`

## Frontend Integration

### TypeScript API

Use the provided API functions from `src/lib/areas.ts`:

```typescript
import { createArea, getAllAreas, getAreaByName } from "@/lib/areas";

// Create a new area
const areaId = await createArea({ name: "Colombo" });

// Get all areas
const areas = await getAllAreas();

// Search for an area by name
const area = await getAreaByName("Colombo");
```

### React Component Example

```tsx
import { useState, useEffect } from "react";
import { createArea, getAllAreas } from "@/lib/areas";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

function AreaManager() {
	const [areas, setAreas] = useState<Area[]>([]);
	const [newAreaName, setNewAreaName] = useState("");

	useEffect(() => {
		loadAreas();
	}, []);

	const loadAreas = async () => {
		const allAreas = await getAllAreas();
		setAreas(allAreas);
	};

	const handleAddArea = async () => {
		if (!newAreaName.trim()) return;

		try {
			await createArea({ name: newAreaName.trim() });
			setNewAreaName("");
			await loadAreas(); // Refresh the list
		} catch (error) {
			console.error("Failed to create area:", error);
		}
	};

	return (
		<div>
			<div>
				<Input
					value={newAreaName}
					onChange={(e) => setNewAreaName(e.target.value)}
					placeholder="Enter area name"
				/>
				<Button onClick={handleAddArea}>Add Area</Button>
			</div>
			<ul>
				{areas.map((area) => (
					<li key={area.id}>{area.name}</li>
				))}
			</ul>
		</div>
	);
}
```

## Features

### Duplicate Prevention

The system automatically prevents duplicate area names. If you try to create an area with a name that already exists, it returns the ID of the existing area instead of creating a duplicate.

```typescript
const id1 = await createArea({ name: "Colombo" }); // Creates new area
const id2 = await createArea({ name: "Colombo" }); // Returns same ID
console.log(id1 === id2); // true
```

### Alphabetical Sorting

When fetching all areas, they are automatically sorted alphabetically by name for easy browsing.

## Testing

To test the areas functionality:

1. Start the application:

    ```bash
    npm run tauri dev
    ```

2. Use the browser console or create a test component:

    ```javascript
    import { createArea, getAllAreas } from "@/lib/areas";

    // In your component or console
    await createArea({ name: "Colombo" });
    await createArea({ name: "Kandy" });
    await createArea({ name: "Galle" });

    const areas = await getAllAreas();
    console.log(areas); // Should show all 3 areas sorted alphabetically
    ```

## Integration with Profiles

Areas can be linked to profiles through the `profile_areas` table. This is handled separately by the profile module.

## Error Handling

All area operations return Result types that handle errors gracefully:

- Database connection failures
- Unique constraint violations
- Query errors

Errors are returned as strings that can be displayed to users or logged.
