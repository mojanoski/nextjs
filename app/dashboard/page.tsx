// app/dashboard/page.tsx

"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, PlusCircle } from "lucide-react";

// Define the type for a single to-do item
type Todo = {
  id: number;
  subject: string;
  description: string | null;
  is_completed: boolean;
  user_id: string;
};

export default function DashboardPage() {
  const supabase = createClient();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newSubject, setNewSubject] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);

  useEffect(() => {
    const fetchTodos = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from("todos")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error fetching todos:", error);
        } else {
          setTodos(data);
        }
      }
    };
    fetchTodos();
  }, [supabase]);

  const handleCreateTodo = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user && newSubject) {
      const { data, error } = await supabase
        .from("todos")
        .insert([{ subject: newSubject, description: newDescription, user_id: user.id }])
        .select()
        .single();
      
      if (error) {
        console.error("Error creating todo:", error);
      } else if (data) {
        setTodos([data, ...todos]);
        setNewSubject("");
        setNewDescription("");
      }
    }
  };

  const handleUpdateTodo = async () => {
    if (editingTodo) {
      const { data, error } = await supabase
        .from("todos")
        .update({ subject: editingTodo.subject, description: editingTodo.description })
        .eq("id", editingTodo.id)
        .select()
        .single();

      if (error) {
        console.error("Error updating todo:", error);
      } else if (data) {
        setTodos(todos.map(todo => todo.id === data.id ? data : todo));
        setEditingTodo(null);
      }
    }
  };

  const handleDeleteTodo = async (id: number) => {
    const { error } = await supabase
      .from("todos")
      .delete()
      .eq("id", id);
    
    if (error) {
      console.error("Error deleting todo:", error);
    } else {
      setTodos(todos.filter(todo => todo.id !== id));
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold md:text-2xl">To-Do List</h1>
        <Dialog>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1">
              <PlusCircle className="h-4 w-4" />
              Create New
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create a new To-Do</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="subject" className="text-right">
                  Subject
                </Label>
                <Input
                  id="subject"
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">
                  Description
                </Label>
                <Textarea
                  id="description"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="secondary">Cancel</Button>
              </DialogClose>
              <DialogClose asChild>
                <Button onClick={handleCreateTodo}>Create</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <div className="rounded-lg border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Subject</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {todos.map((todo) => (
              <TableRow key={todo.id}>
                <TableCell className="font-medium">{todo.subject}</TableCell>
                <TableCell>{todo.description}</TableCell>
                <TableCell>
                  {todo.is_completed ? "Completed" : "Pending"}
                </TableCell>
                <TableCell className="text-right">
                  <Dialog open={!!editingTodo && editingTodo.id === todo.id} onOpenChange={(isOpen) => !isOpen && setEditingTodo(null)}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DialogTrigger asChild>
                          <DropdownMenuItem onClick={() => setEditingTodo(todo)}>
                            Edit
                          </DropdownMenuItem>
                        </DialogTrigger>
                        <DropdownMenuItem onClick={() => handleDeleteTodo(todo.id)} className="text-red-500">
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Edit To-Do</DialogTitle>
                      </DialogHeader>
                      {editingTodo && (
                        <div className="grid gap-4 py-4">
                           <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-subject" className="text-right">
                              Subject
                            </Label>
                            <Input
                              id="edit-subject"
                              value={editingTodo.subject}
                              onChange={(e) => setEditingTodo({ ...editingTodo, subject: e.target.value })}
                              className="col-span-3"
                            />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-description" className="text-right">
                              Description
                            </Label>
                            <Textarea
                              id="edit-description"
                              value={editingTodo.description || ""}
                              onChange={(e) => setEditingTodo({ ...editingTodo, description: e.target.value })}
                              className="col-span-3"
                            />
                          </div>
                        </div>
                      )}
                      <DialogFooter>
                         <DialogClose asChild>
                           <Button type="button" variant="secondary" onClick={() => setEditingTodo(null)}>Cancel</Button>
                         </DialogClose>
                         <Button onClick={handleUpdateTodo}>Save Changes</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}